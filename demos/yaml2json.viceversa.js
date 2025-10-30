const {
  toYAML,
  fromYAML
} = require("../index.js")

// --- Testing Utility ---
function runTests() {
    let testsPassed = 0;
    let testsFailed = 0;

    const assertDeepEquals = (actual, expected, message) => {
        const actualString = JSON.stringify(actual, null, 2);
        const expectedString = JSON.stringify(expected, null, 2);

        if (actualString === expectedString) {
            console.log(`✅ Passed: ${message}`);
            testsPassed++;
        } else {
            console.error(`❌ Failed: ${message}`);
            console.error("   Expected:", expectedString);
            console.error("   Actual:", actualString);
            testsFailed++;
        }
    };

    const assertStringEquals = (actual, expected, message) => {
        if (actual.trim() === expected.trim()) {
            console.log(`✅ Passed: ${message}`);
            testsPassed++;
        } else {
            console.error(`❌ Failed: ${message}`);
            console.error("   Expected:\n---\n", expected, "\n---\n");
            console.error("   Actual:\n---\n", actual, "\n---\n");
        }
    };

    console.log("====================================================");
    console.log("      Testing parseYAMLWithComments (YAML -> JSON)    ");
    console.log("====================================================");

    // Test Case 1: Basic Structure, Comments, and Data Types (Updated for new parser)
    const yaml1 = `
# This is a comment
application:
  name: "My App"
  version: 1.0
  is_active: true
  is_disabled: False
  nullable: null
`;
    const expected1 = {
        application: {
            name: "My App",
            version: 1,
            is_active: true,
            is_disabled: false,
            nullable: null,
        }
    };
    assertDeepEquals(parseYAMLWithComments(yaml1), expected1, "Test 1: Basic structure, comments, and data types");

    // Test Case 2: Block Arrays, Inline Arrays, and Nested Objects (Correctly parsed now)
    const yaml2 = `
user:
  id: 101
  roles: [admin, editor] # Inline array
  settings:
    theme: dark
    permissions:
      - read
      - write
      - update
`;
    const expected2 = {
        user: {
            id: 101,
            roles: ["admin", "editor"], 
            settings: {
                theme: "dark",
                permissions: ["read", "write", "update"], 
            }
        }
    };
    assertDeepEquals(parseYAMLWithComments(yaml2), expected2, "Test 2: Inline arrays, Nested Objects, and Correct Block Array handling");
    
    // --- CUSTOMER'S SAMPLE YAML TEST ---
    const customerYaml = `
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

    const expectedCustomerJson = {
        service: {
            name: "api-gateway",
            port: 8080,
            version: "1.2.3", // Corrected to string, as it is not a simple numeric type.
        },
        database: {
            enabled: true,
            type: "postgres",
            credentials: {
                user: "admin",
                pass: "securepassword",
            },
        },
        features: ["logging", "monitoring", "caching"],
    };
    assertDeepEquals(parseYAMLWithComments(customerYaml), expectedCustomerJson, "Test 3: Customer's provided YAML sample (Version string fixed)");


    // --- JSON TO YAML TESTS (Unchanged, for completeness) ---
    
    console.log("\n====================================================");
    console.log("       Testing toYAML (JSON -> YAML String)         ");
    console.log("====================================================");

    // Test Case 4: Basic Structure and Types
    const json4 = {
        name: "ProjectAlpha",
        status: "active",
        cost: 123.45,
        isEnabled: true,
        host: 'localhost:8080'
    };
    const expectedYAML4 = `
name: ProjectAlpha
status: active
cost: 123.45
isEnabled: true
host: "localhost:8080"
`;
    assertStringEquals(toYAML(json4), expectedYAML4, "Test 4: Basic Types and string quoting");

    // Test Case 5: Nested Objects
    const json5 = {
        server: {
            port: 3000,
            env: {
                prod: false,
                debug: null
            }
        },
        client: {
            version: 2
        }
    };
    const expectedYAML5 = `
server:
  port: 3000
  env:
    prod: false
    debug: null
client:
  version: 2
`;
    assertStringEquals(toYAML(json5), expectedYAML5, "Test 5: Nested objects");

    // Test Case 6: Arrays (Simple and Complex)
    const json6 = {
        simple_list: ["apple", 123, true, "100"],
        complex_list: [
            { id: 1, task: "Buy groceries" },
            { id: 2, task: "Do laundry" }
        ],
        mixed_list: [
            "start",
            { step: 1, action: "configure" },
            "end"
        ]
    };
    const expectedYAML6 = `
simple_list:
  - apple
  - 123
  - true
  - "100"
complex_list:
  - id: 1
    task: Buy groceries
  - id: 2
    task: Do laundry
mixed_list:
  - start
  - step: 1
    action: configure
  - end
`;
    assertStringEquals(toYAML(json6), expectedYAML6, "Test 6: Arrays (Simple, complex, and mixed)");
    
    // Test Case 7: Round-trip test (simple structure)
    const simpleJson = {
        config: {
            value: 99,
            setting: "production",
            nested: { flag: false }
        },
        list: ["a", "b"]
    };
    const yamlFromJson = toYAML(simpleJson);
    const jsonFromYaml = parseYAMLWithComments(yamlFromJson);
    assertDeepEquals(jsonFromYaml, simpleJson, "Test 7: Simple Round-trip (JSON -> YAML -> JSON)");


    console.log("\n====================================================");
    console.log(`Summary: ${testsPassed} passed, ${testsFailed} failed.`);
    console.log("====================================================");
}

// Run the tests
runTests();
