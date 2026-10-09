/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/joint_venture.json`.
 */
export type JointVenture = {
  "address": "Ezssvc6b1pDYT387dBUn95Lac429GQsSz7FHNEHqBcwJ",
  "metadata": {
    "name": "jointVenture",
    "version": "0.1.0",
    "spec": "0.1.0"
  },
  "instructions": [
    {
      "name": "finance",
      "discriminator": [
        133,
        139,
        130,
        178,
        62,
        177,
        62,
        115
      ],
      "accounts": [
        {
          "name": "investor",
          "writable": true,
          "signer": true
        },
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  118,
                  97,
                  114,
                  105,
                  97
                ]
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "project"
              }
            ]
          }
        },
        {
          "name": "source",
          "writable": true
        },
        {
          "name": "position",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "project"
              },
              {
                "kind": "account",
                "path": "investor"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "expectedNonce",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeBavaria",
      "discriminator": [
        90,
        217,
        71,
        194,
        57,
        242,
        209,
        47
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "programAccount",
          "address": "Ezssvc6b1pDYT387dBUn95Lac429GQsSz7FHNEHqBcwJ"
        },
        {
          "name": "programData"
        },
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  118,
                  97,
                  114,
                  105,
                  97
                ]
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "project"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "recordDocument",
      "discriminator": [
        151,
        250,
        131,
        110,
        62,
        59,
        73,
        154
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "project"
          ]
        },
        {
          "name": "project",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  118,
                  97,
                  114,
                  105,
                  97
                ]
              }
            ]
          }
        },
        {
          "name": "documentRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  111,
                  99,
                  117,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "project"
              },
              {
                "kind": "arg",
                "path": "documentId"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "documentId",
          "type": "string"
        },
        {
          "name": "documentName",
          "type": "string"
        },
        {
          "name": "sha256Hash",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "setFinancingEnabled",
      "discriminator": [
        40,
        243,
        253,
        195,
        98,
        241,
        168,
        38
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "project"
          ]
        },
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  118,
                  97,
                  114,
                  105,
                  97
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "enabled",
          "type": "bool"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "documentRecord",
      "discriminator": [
        13,
        153,
        55,
        14,
        109,
        39,
        136,
        125
      ]
    },
    {
      "name": "position",
      "discriminator": [
        170,
        188,
        143,
        228,
        122,
        64,
        247,
        208
      ]
    },
    {
      "name": "project",
      "discriminator": [
        205,
        168,
        189,
        202,
        181,
        247,
        142,
        19
      ]
    }
  ],
  "events": [
    {
      "name": "financingRecorded",
      "discriminator": [
        84,
        157,
        85,
        31,
        50,
        53,
        148,
        3
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorized",
      "msg": "Only the deployed program's upgrade authority can initialize the Bavaria project."
    },
    {
      "code": 6001,
      "name": "wrongDecimals",
      "msg": "The project accepts a classic SPL test-token mint with exactly six decimals."
    },
    {
      "code": 6002,
      "name": "financingDisabled",
      "msg": "Project financing is paused."
    },
    {
      "code": 6003,
      "name": "invalidAmount",
      "msg": "Enter a positive token amount."
    },
    {
      "code": 6004,
      "name": "staleNonce",
      "msg": "This financing attempt has already been recorded or the position has changed. Refresh before a new commitment."
    },
    {
      "code": 6005,
      "name": "wrongPosition",
      "msg": "The position must belong to this project and investor."
    },
    {
      "code": 6006,
      "name": "overflow",
      "msg": "The amount exceeds the supported range."
    }
  ],
  "types": [
    {
      "name": "documentRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "project",
            "type": "pubkey"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "documentId",
            "type": "string"
          },
          {
            "name": "documentName",
            "type": "string"
          },
          {
            "name": "sha256Hash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "financingRecorded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "project",
            "type": "pubkey"
          },
          {
            "name": "investor",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "nonce",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "position",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "project",
            "type": "pubkey"
          },
          {
            "name": "investor",
            "type": "pubkey"
          },
          {
            "name": "contributedUnits",
            "type": "u64"
          },
          {
            "name": "nextNonce",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "project",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "version",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "vaultBump",
            "type": "u8"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "acceptedMint",
            "type": "pubkey"
          },
          {
            "name": "slug",
            "type": "string"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "targetEurCents",
            "type": "u64"
          },
          {
            "name": "infrastructureEurCents",
            "type": "u64"
          },
          {
            "name": "contractedMonthlyRevenueEurCents",
            "type": "u64"
          },
          {
            "name": "totalFinancedUnits",
            "type": "u64"
          },
          {
            "name": "financingEnabled",
            "type": "bool"
          }
        ]
      }
    }
  ]
};
