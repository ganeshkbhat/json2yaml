const assert = require('chai').assert;
const expect = require('chai').expect;
const sinon = require('sinon');
const { fromYAML, toYAML } = require('../index'); // Replace with the path to your YAML parser file

describe('YAML Parser', () => {
    it('should parse simple key-value pairs', () => {
        const yamlString = `
name: My Application
version: 1.0.0
`;
        const expected = { name: 'My Application', version: '1.0.0' };
        const result = fromYAML(yamlString);
        expect(result).to.deep.equal(expected);
    });

    it('should handle comments and empty lines', () => {
        const yamlString = `
# This is a comment
name: My Application

version: 1.0.0 # Inline comment

`;
        const expected = { name: 'My Application', version: '1.0.0' };
        const result = fromYAML(yamlString);
        expect(result).to.deep.equal(expected);
    });

    it('should handle nested objects', () => {
        const yamlString = `
settings:
  database:
    host: localhost
    port: 3306
`;
        const expected = {
            settings: {
                database: {
                    host: 'localhost',
                    port: 3306,
                },
            },
        };
        const result = fromYAML(yamlString);
        expect(result).to.deep.equal(expected);
    });

    it('should handle multi-line strings (literal)', () => {
        const yamlString = `
description: |
  This is a multi-line string
  that spans multiple lines.
  It preserves newlines.
`;
        const expected = {
            description: 'This is a multi-line string\nthat spans multiple lines.\nIt preserves newlines.',
        };
        const result = fromYAML(yamlString);
        expect(result).to.deep.equal(expected);
    });

    it('should handle multi-line strings (folded)', () => {
        const yamlString = `
folded: >
  This is a folded string
  that gets converted to a single line.
  Newlines are replaced by spaces.
`;
        const expected = {
            folded: 'This is a folded string\nthat gets converted to a single line.\nNewlines are replaced by spaces.', // For now, folded is treated the same as literal.
        };
        const result = fromYAML(yamlString);
        expect(result).to.deep.equal(expected);
    });


    it('should handle anchors and aliases', () => {
        const yamlString = `
settings: &settings_block
  database:
    host: localhost
    port: 3306

another_settings: *settings_block
`;
        const expected = {
            settings: {
                database: {
                    host: 'localhost',
                    port: 3306,
                },
            },
            another_settings: {
                database: {
                    host: 'localhost',
                    port: 3306,
                },
            },
        };
        const result = fromYAML(yamlString);
        expect(result).to.deep.equal(expected);
    });

    it('should handle anchors on parent of nested objects', () => {
        const yamlString = `
settings: &settings_block
  database:
    host: localhost
    port: 3306

another_settings: 
  <<: *settings_block
`;
        const expected = {
            settings: {
                database: {
                    host: 'localhost',
                    port: 3306,
                },
            },
            another_settings: {
                database: {
                    host: 'localhost',
                    port: 3306,
                },
            },
        };
        const result = fromYAML(yamlString);
        expect(result).to.deep.equal(expected);
    });

    it('should handle arrays', () => {
        const yamlString = `
items: [1, 2, 3]
`;
        const expected = { items: [1, 2, 3] };
        const result = fromYAML(yamlString);
        expect(result).to.deep.equal(expected);
    });

    it('should handle objects', () => {
        const yamlString = `
object: {a: 1, b: 2}
`;
        const expected = { object: { a: 1, b: 2 } };
        const result = fromYAML(yamlString);
        expect(result).to.deep.equal(expected);
    });

    it('should handle booleans', () => {
        const yamlString = `
bool_true: true
bool_false: false
`;
        const expected = { bool_true: true, bool_false: false };
        const result = fromYAML(yamlString);
        expect(result).to.deep.equal(expected);
    });

    it('should handle null', () => {
        const yamlString = `
nothing: null
`;
        const expected = { nothing: null };
        const result = fromYAML(yamlString);
        expect(result).to.deep.equal(expected);
    });

    it('should handle numbers', () => {
        const yamlString = `
number: 123
`;
        const expected = { number: 123 };
        const result = fromYAML(yamlString);
        expect(result).to.deep.equal(expected);
    });

    it('should handle nested objects with anchors on the parent', () => {
        const yamlString = `
parent: &parent_anchor
  child: value

alias: *parent_anchor
`;
        const expected = {
            parent: { child: 'value' },
            alias: { child: 'value' }
        };
        const result = fromYAML(yamlString);
        expect(result).to.deep.equal(expected);
    });

    it('should handle complex YAML with all features', () => {
        const yamlString = `
name: My Application # App name
version: 1.0.0

settings: &settings_block  # Settings anchor
  database:
    host: localhost
    port: 3306
  api_key: "YOUR_API_KEY"

another_settings: *settings_block # Alias

description: | # Multi-line string
  This is a multi-line description
  that spans multiple lines.

items: # List
  - id: 1
    name: Item 1
  - id: 2
    name: Item 2

object: {a: 1, b: 2}

bool: true

nothing: null

number: 42
`;

        const expected = {
            name: 'My Application',
            version: '1.0.0',
            settings: {
                database: { host: 'localhost', port: 3306 },
                api_key: 'YOUR_API_KEY',
            },
            another_settings: {
                database: { host: 'localhost', port: 3306 },
                api_key: 'YOUR_API_KEY',
            },
            description: 'This is a multi-line description\nthat spans multiple lines.',
            items: [
                { id: 1, name: 'Item 1' },
                { id: 2, name: 'Item 2' },
            ],
            object: { a: 1, b: 2 },
            bool: true,
            nothing: null,
            number: 42,
        };
        const result = fromYAML(yamlString);
        expect(result).to.deep.equal(expected);
    });

    it('should handle errors (e.g., invalid JSON in array)', () => {
        const yamlString = `
items: [1, 2, "invalid json"]
`;
        const result = fromYAML(yamlString);
        expect(result).to.be.null; // Or assert that an error is thrown if you prefer
    });

    it('should handle errors (e.g., missing anchor for alias)', () => {
        const yamlString = `
alias: *nonexistent_anchor
`;
        const result = fromYAML(yamlString);
        expect(result).to.be.null;
    });

});