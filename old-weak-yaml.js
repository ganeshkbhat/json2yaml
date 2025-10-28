function parseYAMLWithComments(yamlString) {
    const lines = yamlString.split('\n');
    const data = {};
    let currentLevel = data;
    const stack = [];
    const anchors = {}; // Store anchors and their corresponding values

    let multiLineValue = null;
    let multiLineKey = null;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        const cleanedLine = line.trim();

        if (cleanedLine.startsWith('#') || cleanedLine === '') {
            continue;
        }

        const indentation = line.search(/\S/);

        if (multiLineValue !== null) {
            if (line.search(/\S/) > indentation) {
                multiLineValue += (multiLineValue ? '\n' : '') + line.trim();
                continue;
            } else {
                currentLevel[multiLineKey] = multiLineValue;
                multiLineValue = null;
                multiLineKey = null;
            }
        }

        let key, value;

        const colonIndex = line.indexOf(':');
        if (colonIndex !== -1) {
            key = line.substring(indentation, colonIndex).trim();
            value = line.substring(colonIndex + 1).trim();


            // Anchor handling:
            if (key.includes('&')) {
                const anchorName = key.split('&')[1].split(' ')[0]; // Extract anchor name
                key = key.split('&')[0].trim(); // Key without anchor

                // Store the value associated with the anchor.  We'll resolve it later
                anchors[anchorName] = { value: value, level: currentLevel, key: key };
            }

            if (value === "") { // nested object
                const newLevel = {};
                currentLevel[key] = newLevel;
                stack.push({ level: currentLevel, indent: indentation });
                currentLevel = newLevel;
                continue; // Process next line
            }

            if (value.startsWith('|') || value.startsWith('>')) {
                multiLineKey = key;
                multiLineValue = "";
                continue;
            } else if (value.startsWith('[') && value.endsWith(']')) {
                try {
                    value = JSON.parse(value);
                } catch (e) {
                    console.error("Error parsing array:", e);
                    return null;
                }
            } else if (value.startsWith('{') && value.endsWith('}')) {
                try {
                    value = JSON.parse(value);
                } catch (e) {
                    console.error("Error parsing object:", e);
                    return null;
                }
            } else if (!isNaN(value)) {
                value = Number(value);
            } else if (value.toLowerCase() === 'true') {
                value = true;
            } else if (value.toLowerCase() === 'false') {
                value = false;
            } else if (value.toLowerCase() === 'null') {
                value = null;
            }



            while (stack.length > 0 && indentation <= stack[stack.length - 1].indent) {
                currentLevel = stack.pop().level;
            }

            currentLevel[key] = value;

        } else if (line.includes(':')) { // handle nested objects with anchors on the parent
            const parts = line.split(':');
            key = parts[0].trim();
            const rest = parts.slice(1).join(':').trim();

            if (key.includes('&')) {
                const anchorName = key.split('&')[1].split(' ')[0]; // Extract anchor name
                key = key.split('&')[0].trim(); // Key without anchor

                const newLevel = {};
                currentLevel[key] = newLevel;
                stack.push({ level: currentLevel, indent: indentation });
                currentLevel = newLevel;

                anchors[anchorName] = { value: newLevel, level: currentLevel, key: key };
            }

        }



    }

    if (multiLineValue !== null) {
        currentLevel[multiLineKey] = multiLineValue;
    }

    // Resolve anchors *after* parsing:
    for (const anchorName in anchors) {
        const { value, level, key } = anchors[anchorName];
        if (value.startsWith('*')) { // It's an alias
            const aliasedAnchor = value.substring(1);
            if (anchors[aliasedAnchor]) {
                level[key] = structuredClone(anchors[aliasedAnchor].value); // Deep copy for aliases
            } else {
                console.error(`Error: Anchor '${aliasedAnchor}' not found.`);
                return null; // Or handle the error as needed
            }
        }
    }

    return data;
}



// Example with anchors and aliases:
const yamlString = `
name: My Application
settings: &settings_block  # Anchor for settings
  database:
    host: localhost
    port: 3306
  api_key: "YOUR_API_KEY"

another_settings: *settings_block # Alias to settings

more_settings: &more_settings
  db:
    host: remotehost

copy_of_more_settings: *more_settings
`;

const yamlData = parseYAMLWithComments(yamlString);

if (yamlData) {
    console.log(JSON.stringify(yamlData, null, 2));
}