
const {
  toYAML,
  fromYAML
} = require("../index.js")

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

const yamlData = fromYAML(yamlString);

if (yamlData) {
  console.log(JSON.stringify(yamlData, null, 2));
}
