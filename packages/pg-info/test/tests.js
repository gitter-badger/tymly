/* eslint-env mocha */

'use strict'

const HlPgClient = require('hl-pg-client')
const process = require('process')
const path = require('path')
const pgInfo = require('./../lib')
const chai = require('chai')
const chaiSubset = require('chai-subset')
chai.use(chaiSubset)
const expect = chai.expect
let client

// Make a Postgres client

describe('Run the basic-usage example', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  it('Should create a new pg client', () => {
    const pgConnectionString = process.env.PG_CONNECTION_STRING
    client = new HlPgClient(pgConnectionString)
  })

  it('Should install test schemas', () => {
    return client.runFile(path.resolve(__dirname, 'fixtures', 'install-test-schemas.sql'))
  })

  // Temporarily here and not in script because client.runFile will break the statement down on ';'
  it('Should create test triggers', () => {
    return client.query(`CREATE OR REPLACE FUNCTION append_inserted_craters_row() RETURNS trigger AS $BODY$
    BEGIN INSERT INTO pginfo_planets_test.new_craters (id, title) VALUES (new.id, new.title);
    RETURN NEW;
    END;
    $BODY$ LANGUAGE plpgsql;`)
  })

  // Temporarily here and not in script because client.runFile will break the statement down on ';'
  it('Should create test triggers', () => {
    return client.query(`CREATE TRIGGER new_craters_trigger BEFORE INSERT ON pginfo_planets_test.craters EXECUTE PROCEDURE append_inserted_craters_row();`)
  })

  it('Should get some database info (callback)', function (done) {
    pgInfo(
      {
        client: client,
        schemas: schemaNames
      },
      function (err, info) {
        expect(info.schemas.pginfo_planets_test.tables.craters.triggers).to.eql(
          {
            new_craters_trigger: {
              event_object_schema: 'pginfo_planets_test',
              event_manipulation: 'INSERT',
              event_object_table: 'craters',
              action_condition: null,
              action_statement: 'EXECUTE PROCEDURE append_inserted_craters_row()',
              action_orientation: 'STATEMENT',
              action_timing: 'BEFORE'
            }
          }
        )
        expect(info.schemas.pginfo_people_test.tables.people.triggers).to.eql({})
        expect(info.schemas.pginfo_planets_test.tables.planets.triggers).to.eql({})
        expect(info.schemas.pginfo_planets_test.tables.moons.triggers).to.eql({})
        expect(info.schemas.pginfo_planets_test.tables.new_craters.triggers).to.eql({})
        expect(err).to.equal(null)
        expect(info).to.containSubset(
          {
            schemas: expectedSchemas
          }
        )
        done()
      }
    )
  })

  it('Should get some database info (promise)', function () {
    pgInfo(
      {
        client: client,
        schemas: schemaNames
      })
      .then(info =>
        expect(info).to.containSubset(
          {
            schemas: expectedSchemas
          }
        )
      ) // pgInfo
  })

  it('Should uninstall test schemas', () => {
    return client.runFile(path.resolve(__dirname, 'fixtures', 'uninstall-test-schemas.sql'))
  })
})

const schemaNames = ['pginfo_people_test', 'pginfo_planets_test', 'pginfo_not_exists']

const expectedSchemas = {
  'pginfo_people_test': {
    'schemaExistsInDatabase': true,
    'comment': 'Simple schema created to support testing of the pg-info package!',
    'tables': {
      'people': {
        'comment': 'Isn\'t this just a list of people?',
        'pkColumnNames': [
          'person_no'
        ],
        'columns': {
          'person_no': {
            'array': false,
            'columnDefault': null,
            'isNullable': 'NO',
            'dataType': 'text',
            'characterMaximumLength': null,
            'numericScale': null,
            'comment': null
          },
          'first_name': {
            'array': false,
            'columnDefault': null,
            'isNullable': 'NO',
            'dataType': 'text',
            'characterMaximumLength': null,
            'numericScale': null,
            'comment': 'Person\'s first name'
          },
          'last_name': {
            'array': false,
            'columnDefault': null,
            'isNullable': 'NO',
            'dataType': 'text',
            'characterMaximumLength': null,
            'numericScale': null,
            'comment': null
          },
          'age': {
            'array': false,
            'columnDefault': null,
            'isNullable': 'YES',
            'dataType': 'integer',
            'characterMaximumLength': null,
            'numericScale': 0,
            'comment': 'Age in years'
          },
          '_created': {
            'array': false,
            'columnDefault': 'now()',
            'isNullable': 'NO',
            'dataType': 'timestamp with time zone',
            'characterMaximumLength': null,
            'numericScale': null,
            'comment': 'Timestamp for when this record was created'
          }
        },
        'indexes': {
          'people_age_idx': {
            'columns': [
              [
                'age'
              ]
            ],
            'unique': false,
            'method': 'btree'
          },
          'people_first_name_last_name_idx': {
            'columns': [
              [
                'first_name',
                'last_name'
              ]
            ],
            'unique': false,
            'method': 'btree'
          }
        },
        'triggers': {},
        'fkConstraints': {}
      }
    }
  },
  'pginfo_planets_test': {
    'schemaExistsInDatabase': true,
    'comment': 'Schema containing 3 related tables to support testing of the pg-info package!',
    'tables': {
      'planets': {
        'comment': 'A list of planets',
        'pkColumnNames': [
          'name'
        ],
        'columns': {
          'name': {
            'array': false,
            'columnDefault': null,
            'isNullable': 'NO',
            'dataType': 'text',
            'characterMaximumLength': null,
            'numericScale': null,
            'comment': 'Unique planet name'
          },
          'title': {
            'array': false,
            'columnDefault': null,
            'isNullable': 'NO',
            'dataType': 'text',
            'characterMaximumLength': null,
            'numericScale': null,
            'comment': 'The display-label of the planet'
          },
          'type': {
            'array': false,
            'columnDefault': null,
            'isNullable': 'YES',
            'dataType': 'text',
            'characterMaximumLength': null,
            'numericScale': null,
            'comment': 'What type of planet is this?'
          },
          'diameter': {
            'array': false,
            'columnDefault': null,
            'isNullable': 'YES',
            'dataType': 'numeric',
            'characterMaximumLength': null,
            'numericScale': null,
            'comment': 'The diameter of the planet, in metres'
          },
          'color': {
            'array': false,
            'columnDefault': null,
            'isNullable': 'YES',
            'dataType': 'numeric',
            'characterMaximumLength': null,
            'numericScale': null,
            'comment': 'What color is this planet?'
          },
          'tags': {
            'array': true,
            'columnDefault': null,
            'isNullable': 'YES',
            'dataType': 'text',
            'characterMaximumLength': null,
            'numericScale': null
          },
          'url': {
            'array': false,
            'columnDefault': null,
            'isNullable': 'YES',
            'dataType': 'text',
            'characterMaximumLength': null,
            'numericScale': null,
            'comment': 'Further reading available here!'
          },
          'other_facts': {
            'columnDefault': null,
            'isNullable': 'YES',
            'dataType': 'jsonb',
            'characterMaximumLength': null,
            'numericScale': null,
            'comment': null,
            'array': false
          },
          '_created': {
            'array': false,
            'columnDefault': 'now()',
            'isNullable': 'NO',
            'dataType': 'timestamp with time zone',
            'characterMaximumLength': null,
            'numericScale': null,
            'comment': 'Timestamp for when this record was created'
          }
        },
        'indexes': {
          'other_facts_idx': {
            'columns': [
              [
                'other_facts'
              ]
            ],
            'unique': false,
            'method': 'gin'
          }
        },
        'triggers': {},
        'fkConstraints': {}
      },
      'moons': {
        'comment': 'Auto-generated via Tableware.js!',
        'pkColumnNames': [
          'id'
        ],
        'columns': {
          'id': {
            'array': false,
            'columnDefault': null,
            'isNullable': 'NO',
            'dataType': 'uuid',
            'characterMaximumLength': null,
            'numericScale': null,
            'comment': 'Automatically added UUID-based primary key column'
          },
          'title': {
            'array': false,
            'columnDefault': null,
            'isNullable': 'NO',
            'dataType': 'text',
            'characterMaximumLength': null,
            'numericScale': null,
            'comment': 'The display-label of the moon'
          },
          'discovered_by': {
            'array': false,
            'columnDefault': null,
            'isNullable': 'YES',
            'dataType': 'text',
            'characterMaximumLength': null,
            'numericScale': null,
            'comment': 'Name of the person who discovered the moon'
          },
          'discovery_year': {
            'array': false,
            'columnDefault': null,
            'isNullable': 'YES',
            'dataType': 'integer',
            'characterMaximumLength': null,
            'numericScale': 0,
            'comment': 'Year the moon was discovered (e.g. 1804)'
          },
          'planet_name': {
            'array': false,
            'columnDefault': null,
            'isNullable': 'YES',
            'dataType': 'text',
            'characterMaximumLength': null,
            'numericScale': null,
            'comment': 'Auto-added foreign key for planets'
          },
          '_created': {
            'array': false,
            'columnDefault': 'now()',
            'isNullable': 'NO',
            'dataType': 'timestamp with time zone',
            'characterMaximumLength': null,
            'numericScale': null,
            'comment': 'Timestamp for when this record was created'
          }
        },
        'indexes': {
          'moons_planets_name_idx': {
            'columns': [
              [
                'planet_name'
              ]
            ],
            'unique': false,
            'method': 'btree'
          }
        },
        'triggers': {},
        'fkConstraints': {
          'moons_to_planets_fk': {
            'targetTable': 'pginfo_planets_test.planets',
            'sourceColumns': [
              'planet_name'
            ],
            'targetColumns': [
              'name'
            ]
          }
        }
      },
      'craters': {
        'comment': 'Auto-generated via Tableware.js!',
        'pkColumnNames': [
          'id'
        ],
        'columns': {
          'id': {
            'array': false,
            'columnDefault': null,
            'isNullable': 'NO',
            'dataType': 'uuid',
            'characterMaximumLength': null,
            'numericScale': null,
            'comment': 'Automatically added UUID-based primary key column'
          },
          'title': {
            'array': false,
            'columnDefault': null,
            'isNullable': 'NO',
            'dataType': 'text',
            'characterMaximumLength': null,
            'numericScale': null,
            'comment': 'The display-label of the crater'
          },
          'diameter': {
            'array': false,
            'columnDefault': null,
            'isNullable': 'YES',
            'dataType': 'integer',
            'characterMaximumLength': null,
            'numericScale': 0,
            'comment': 'Diameter of the crater, in metres'
          },
          'moons_id': {
            'array': false,
            'columnDefault': null,
            'isNullable': 'YES',
            'dataType': 'uuid',
            'characterMaximumLength': null,
            'numericScale': null,
            'comment': 'Auto-added foreign key for moons'
          },
          '_created': {
            'array': false,
            'columnDefault': 'now()',
            'isNullable': 'NO',
            'dataType': 'timestamp with time zone',
            'characterMaximumLength': null,
            'numericScale': null,
            'comment': 'Timestamp for when this record was created'
          }
        },
        'indexes': {
          'craters_moons_id_idx': {
            'columns': [
              [
                'moons_id'
              ]
            ],
            'unique': false,
            'method': 'btree'
          }
        },
        'triggers': {
          'new_craters_trigger': {
            'event_object_schema': 'pginfo_planets_test',
            'event_manipulation': 'INSERT',
            'event_object_table': 'craters',
            'action_condition': null,
            'action_statement': 'EXECUTE PROCEDURE append_inserted_craters_row()',
            'action_orientation': 'STATEMENT',
            'action_timing': 'BEFORE'
          }
        },
        'fkConstraints': {
          'craters_to_moons_fk': {
            'targetTable': 'pginfo_planets_test.moons',
            'sourceColumns': [
              'moons_id'
            ],
            'targetColumns': [
              'id'
            ]
          }
        }
      }
    }
  },
  'pginfo_not_exists': {
    'schemaExistsInDatabase': false
  }
}
