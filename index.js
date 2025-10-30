// --- Helper Function to parse primitives and inline structures ---

/**
 * Parses a raw string value from a YAML line into its proper JavaScript type (number, boolean, null, array, string).
 * @param {string} rawValue - The raw string value from the YAML line.
 * @returns {*} The parsed JavaScript value.
 */
function parsePrimitive(rawValue) {
    if (rawValue === undefined || rawValue === null) return rawValue;

    // Inline JSON array or object parsing
    if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
        try {
            // 1. Attempt standard JSON parsing (after replacing single quotes)
            return JSON.parse(rawValue.replace(/'/g, '"'));
        } catch (e) {
            // 2. Fallback: If JSON parsing fails (likely due to unquoted strings in YAML lists like [a, b, c]),
            // treat the inner contents as simple comma-separated string items.
            const innerContent = rawValue.substring(1, rawValue.length - 1).trim();
            if (innerContent === '') {
                return [];
            }
            // Split by comma, trim, and then recursively call parsePrimitive on each item 
            // to correctly cast numbers, booleans, and nulls within the inline array.
            return innerContent.split(',')
                .map(item => item.trim())
                .map(item => parsePrimitive(item));
        }
    }

    // Type casting for booleans and null
    const lowerValue = rawValue.toLowerCase();
    if (lowerValue === 'true') {
        return true;
    }
    if (lowerValue === 'false') {
        return false;
    }
    if (lowerValue === 'null' || lowerValue === '~') {
        return null;
    }

    // Number casting
    // Note: '1.2.3' will fail this check (resolve to NaN) and correctly remain a string.
    if (!isNaN(rawValue) && rawValue !== '') {
        return Number(rawValue);
    }
    
    // Remove quotes from simple quoted strings
    if ((rawValue.startsWith('"') && rawValue.endsWith('"')) || 
        (rawValue.startsWith("'") && rawValue.endsWith("'"))) {
        return rawValue.substring(1, rawValue.length - 1);
    }

    return rawValue;
}


// --- Function 1 (Rewritten): YAML String to JavaScript Object ---

/**
 * Converts a YAML string to a JavaScript object (JSON equivalent) using an
 * indentation-based parsing approach, without external dependencies.
 * NOTE: This parser is simplified and does not support complex features like anchors/aliases or multi-line block scalars (|, >).
 * @param {string} yamlString - The YAML content to parse.
 * @returns {object} The resulting JavaScript object.
 */
function fromYAML(yamlString) {
    const lines = yamlString.split('\n');
    const root = {};
    // Stack structure: { level: object/array reference, indent: indentation level, isArray: boolean }
    const stack = [{ level: root, indent: -1, isArray: false }];
    
    for (const line of lines) {
        // 1. Clean and check line validity (ignore comments and empty lines)
        const trimmedLine = line.trim();
        if (trimmedLine === '' || trimmedLine.startsWith('#')) {
            continue;
        }

        const currentIndent = line.search(/\S/);
        
        // FIX: Strip inline comments from the content line before parsing the key/value pair.
        let contentLine = trimmedLine;
        const hashIndex = trimmedLine.indexOf('#');
        if (hashIndex !== -1) {
            contentLine = trimmedLine.substring(0, hashIndex).trim();
        }
        
        if (contentLine === '') {
            continue;
        }

        // 2. Adjust context based on indentation
        while (stack.length > 1 && currentIndent <= stack[stack.length - 1].indent) {
            stack.pop();
        }
        let currentContext = stack[stack.length - 1].level;
        const parentContext = stack[stack.length - 1];

        // 3. Process array items (`- ` prefix)
        if (contentLine.startsWith('-')) {
            if (!parentContext.isArray) {
                // Ignore malformed item if not in an array context
                continue; 
            }
            
            let arrayItem = contentLine.substring(1).trim();
            
            // Check for array of objects (e.g., - key: value)
            let objMatch = arrayItem.match(/^([^:]+):\s*(.*)$/);
            if (objMatch) {
                const newObj = {};
                const itemKey = objMatch[1].trim();
                const itemValue = parsePrimitive(objMatch[2].trim());
                newObj[itemKey] = itemValue;
                currentContext.push(newObj);
                
                // Push the new object context onto stack for potential further nesting
                stack.push({ level: newObj, indent: currentIndent, isArray: false });

            } else {
                // Simple array item
                currentContext.push(parsePrimitive(arrayItem));
            }
        }
        
        // 4. Process key-value pairs (`:`)
        let match = contentLine.match(/^([^:]+):\s*(.*)$/);
        
        if (match) {
            let key = match[1].trim();
            let rawValue = match[2].trim();
            let value;
            
            // Check for next line to determine if this is a block array/object definition
            let nextLineIndex = lines.indexOf(line) + 1;
            let nextLine = nextLineIndex < lines.length ? lines[nextLineIndex] : null;
            let isBlockArray = nextLine && nextLine.trim().startsWith('-');

            if (rawValue === '') {
                // Nested object or block array
                value = isBlockArray ? [] : {};
                currentContext[key] = value;
                
                // Push new context onto the stack
                stack.push({ level: value, indent: currentIndent, isArray: isBlockArray });
            } else {
                // Primitive or inline structure
                value = parsePrimitive(rawValue);
                currentContext[key] = value;
            }
        }
    }
    
    return root;
}


// --- Function 2: JavaScript Object to YAML String (The Inverse Function) ---

/**
 * Converts a JavaScript object to a YAML string.
 * NOTE: This is a simplified implementation and does not support complex YAML features
 * like anchors, aliases, or multi-line block scalars (|, >).
 * @param {object} jsonObject - The JavaScript object to convert.
 * @param {number} [indentation=0] - The current level of indentation (used for recursion).
 * @returns {string} The resulting YAML string.
 */
function toYAML(jsonObject, indentation = 0) {
    let yamlString = '';
    const indent = '  '.repeat(indentation); // Use 2 spaces for indentation

    for (const key in jsonObject) {
        if (!Object.prototype.hasOwnProperty.call(jsonObject, key)) {
            continue;
        }

        const value = jsonObject[key];
        const newIndent = '  '.repeat(indentation + 1);

        if (Array.isArray(value)) {
            // Handle arrays
            yamlString += `${indent}${key}:\n`;
            value.forEach(item => {
                if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                    // Array of objects/maps
                    // Recursively process the object, but prepend the '- ' marker on the first line
                    const objectAsYAML = toYAML(item, indentation + 1).trimEnd();
                    const lines = objectAsYAML.split('\n');
                    
                    // The first line needs the array hyphen, subsequent lines need only indentation
                    yamlString += `${newIndent}- ${lines[0].trimStart()}\n`;
                    for(let i = 1; i < lines.length; i++) {
                         yamlString += `${newIndent}  ${lines[i].trimStart()}\n`;
                    }
                } else {
                    // Array of simple values
                    let formattedItem;
                    if (item === null) {
                        formattedItem = 'null';
                    } else if (typeof item === 'string') {
                        // Quote strings if they look like numbers, booleans, or contain special characters
                        if (item.match(/^(true|false|null|[0-9]+(\.[0-9]+)?|.*:.*)$/i)) {
                            formattedItem = `"${item}"`;
                        } else {
                            formattedItem = item;
                        }
                    } else {
                        formattedItem = String(item);
                    }
                    yamlString += `${newIndent}- ${formattedItem}\n`;
                }
            });

        } else if (typeof value === 'object' && value !== null) {
            // Handle nested objects/maps
            yamlString += `${indent}${key}:\n`;
            yamlString += toYAML(value, indentation + 1);

        } else {
            // Handle simple key-value pairs
            let formattedValue;
            if (value === null) {
                formattedValue = 'null';
            } else if (typeof value === 'string') {
                // Quote strings if they look like numbers, booleans, or contain special characters
                if (value.match(/^(true|false|null|[0-9]+(\.[0-9]+)?|.*:.*)$/i)) {
                    formattedValue = `"${value}"`;
                } else {
                    formattedValue = value;
                }
            } else {
                formattedValue = String(value);
            }
            yamlString += `${indent}${key}: ${formattedValue}\n`;
        }
    }

    return yamlString;
}

// /**
//  * Converts a JavaScript object to a YAML string.
//  * NOTE: This is a simplified implementation and does not support complex YAML features 
//  * like anchors, aliases, comments, or multi-line block scalars (|, >).
//  * @param {object} jsonObject - The JavaScript object to convert.
//  * @param {number} [indentation=0] - The current level of indentation (used for recursion).
//  * @returns {string} The resulting YAML string.
//  */
// function toYAML(jsonObject, indentation = 0) {
//     let yamlString = '';
//     const indent = '  '.repeat(indentation); // Use 2 spaces for indentation

//     for (const key in jsonObject) {
//         if (!Object.prototype.hasOwnProperty.call(jsonObject, key)) {
//             continue;
//         }

//         const value = jsonObject[key];
//         const newIndent = '  '.repeat(indentation + 1);

//         if (Array.isArray(value)) {
//             // Handle arrays
//             yamlString += `${indent}${key}:\n`;
//             value.forEach(item => {
//                 if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
//                     // Array of objects/maps
//                     yamlString += `${newIndent}- ${toYAML(item, indentation + 1).trimStart()}\n`;
//                 } else {
//                     // Array of simple values
//                     let formattedItem = item === null ? 'null' : String(item);
//                     // Add quotes for strings that might be misinterpreted as numbers/booleans
//                     if (typeof item === 'string' && (formattedItem.toLowerCase() === 'true' || formattedItem.toLowerCase() === 'false' || !isNaN(Number(formattedItem)) || formattedItem.includes(':'))) {
//                         formattedItem = `"${formattedItem}"`;
//                     }
//                     yamlString += `${newIndent}- ${formattedItem}\n`;
//                 }
//             });

//         } else if (typeof value === 'object' && value !== null) {
//             // Handle nested objects/maps
//             yamlString += `${indent}${key}:\n`;
//             yamlString += toYAML(value, indentation + 1);

//         } else {
//             // Handle simple key-value pairs
//             let formattedValue;
//             if (value === null) {
//                 formattedValue = 'null';
//             } else if (typeof value === 'string') {
//                 // Add quotes for strings that might be misinterpreted as numbers/booleans
//                 if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false' || !isNaN(Number(value)) || value.includes(':')) {
//                     formattedValue = `"${value}"`;
//                 } else {
//                     formattedValue = value;
//                 }
//             } else {
//                 formattedValue = String(value);
//             }
//             yamlString += `${indent}${key}: ${formattedValue}\n`;
//         }
//     }

//     return yamlString;
// }

module.exports = { fromYAML, toYAML } 

