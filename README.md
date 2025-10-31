# json2yaml
json to yaml or yaml to json

#### json to yaml
```
const jsonObject = {
    "name": "My Application",
    "settings": {
        "database": {
            "host": "localhost",
            "port": 3306
        },
        "api_key": "YOUR_API_KEY"
    },
    "another_settings": {
        "database": {
            "host": "localhost",
            "port": 3306
        },
        "api_key": "YOUR_API_KEY"
    },
    "more_settings": {
        "db": {
            "host": "remotehost"
        }
    },
    "copy_of_more_settings": {
        "db": {
            "host": "remotehost"
        }
    }
};

const yamlOutput = toYAML(jsonObject);

```

#### yaml to json

```
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
```


