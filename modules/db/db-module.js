
const pg = require('pg');

//exports query so any file that needs database information can require db-module.js
module.exports = {
    query
};

//config information for Nicks local test database server
const dbConfig = {
    user: 'postgres',
    password: 'ndWags0812',
    host: 'localhost',
    database: 'postgres',
    port: '5444',
    idleTimeoutMillis: 30000,
}

// //config information for Sams local test database server
// const dbConfig = {
//     user: 'postgres',
//     password: '123',
//     host: 'localhost',
//     database: 'database',
//     port: '5432',
//     idleTimeoutMillis: 30000,
// }

// //Config information for live database server
// const dbConfig = {
//     user: 'pgtest@pgserverstaging',
//     password: '0N8eepALHco7',
//     host: 'pgserverstaging.postgres.database.azure.com',
//     database: 'test',
//     port: '5432',
//     sslmode: 'require',
//     idleTimeoutMillis: 30000,
// }

//uses config information to connect to the database
const pool = new pg.Pool(dbConfig);

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err)
    process.exit(-1)
})

function query(text, params, callback){
    return new Promise((resolve,reject)=>{
        return pool.query(text, params, (err, result) =>{
            if(err) {
                return reject(err)
            }
            resolve(result)
        })
    })
}
