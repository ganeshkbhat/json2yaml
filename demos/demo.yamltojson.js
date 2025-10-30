var { fromYAML, toYAML } = require("../index.js")
// --- Example Usage ---

// 1. Example YAML Content
const exampleYaml = `
# Configuration for a service
service:
  name: api-gateway
  port: 8080
  version: 1.2.3

database:
  enabled: true
  type: postgres
  credentials:
    user: admin
    pass: securepassword
  
features: [logging, monitoring, caching]
`;

console.log("--- Original YAML Content ---");
console.log(exampleYaml);

// Convert YAML to JSON
const convertedJson = fromYAML(exampleYaml);
if (convertedJson) {
  console.log("\n--- Converted JSON Content ---");
  console.log(JSON.parse(JSON.stringify(convertedJson)));

  // 2. Example JSON Content (using the result of the previous step)
  const exampleJson = convertedJson; // Use the newly converted JSON for the next test

  // Convert JSON back to YAML
  const convertedYaml = toYAML(exampleJson);
  if (convertedYaml) {
    console.log("\n--- Converted YAML (back from JSON) ---");
    console.log(convertedYaml);
  }
}

// 3. Example with a simple JSON object string
const simpleJson = '{"person": {"name": "Alice", "age": 30, "city": "Wonderland"}}';
console.log("\n--- Simple JSON Conversion Test ---");
const simpleYaml = toYAML(JSON.parse(simpleJson));
if (simpleYaml) {
  console.log(simpleYaml);
}
