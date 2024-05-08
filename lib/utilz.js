const fs = require("fs")

const crypto = require("node:crypto")
// const db = require('mysql2-promise')();
const dbconfig = require("../dbconfig.json")
var mysql = require('mysql');
const { exec } = require("node:child_process");
const path = require("path");
var con = mysql.createConnection(dbconfig);

con.connect(function (err) {
    if (err) throw err;
    console.log("DB Connected!");
})

async function execute(sql, arr) {
    return new Promise((res, rej) => {
        con.query(sql, arr,
            function executeCallback(err, result) {
                if (err) {
                    console.error(err)
                    rej(err)
                    // throw err
                }
                res(result);
            })
    })
}

/**
 * 
 * @param {Number} length 
 * @returns {string}
 * Generate a random string of given length
 */
function generateToken(length = 10) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let tokenLength = length || 32;
    let token = "";
    for (let i = 0; i < tokenLength; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        token += characters.charAt(randomIndex);
    }
    return token;
}

function hash(text, size = 10) {
    const hash = crypto.createHash("sha256")
    return hash.update(text).digest("hex").toString().slice(0, size)
}

async function addUser({ user_email, password, full_name }) {
    const username = generateToken(6);
    const password_hash = hash(password);

    console.log("adding user", { user_email, password_hash, full_name, password })

    let success = false
    try {
        // await db.query(`INSERT INTO users (username, email, password_hash, full_name) VALUES (?,?,?,?);`, [username, user_email, password_hash, full_name])
        await execute(`INSERT INTO users (username, email, password_hash, full_name) VALUES (?,?,?,?)`, [username, user_email, password_hash, full_name])
        success = true
    } catch (e) {
        console.error(e);
    }
    return success
}


const wait = (n = 0) => new Promise(res => setTimeout(res, n))

/**
 * 
 * @param {*} uid 
 * @returns {String}
 * return user login from `user_login_tokens` table
 */
async function performLogin(email, password) {
    let loginToken = false
    try {
        // const result = await db.query(`select * from users where email=? and password_hash=?`, [email, hash(password)])
        const result = await execute(`select * from users where email=? and password_hash=?`, [email, hash(password)])
        if (result.length === 1) {
            const user = result?.at(0);
            loginToken = generateToken();
            const tokenResult = await execute(`insert into user_login_tokens (user_id, token) values ('${user.id}','${loginToken}')`);
            console.log(tokenResult);
        }
    } catch (e) {
        console.error(e);
        loginToken = false
    }

    return loginToken
}

function setCookieToken(res, token) {
    res.cookie('utoken', token, {
        // Optional cookie settings
        maxAge: 2592000000, // Expires in 1 month (in milliseconds)
        httpOnly: true, // Restricts access from client-side JavaScript
        secure: true // Requires HTTPS for transmission (for increased security)
    });
}

async function searchUser(search_str) {
    const result = Array();
    const sql = "SELECT full_name FROM users WHERE full_name LIKE ?";
    let output = await execute(sql, [search_str + "%"]);
    // console.log({output});
    for (let row of output) {
        result.push({ name: row.full_name })
    }
    console.log({ result })
    return result;
}

/**
 * Return a boolean representing a table exists or not in a given database
 * @param {string} db 
 * @param {string} table 
 * @returns {boolean}
 */
async function isTable(db, table) {
    const result = await execute(`SELECT *
    FROM information_schema.tables
    WHERE table_schema = ?
    AND table_name = ?
    `, [db, table]);
    return result.length > 0;
}

function removeDoubleSpace(str = "") {
    while (str.includes("  ")) str = str.replace("  ", " ")
    return str;
}

async function setupDB() {
    const isUsers = await isTable("chat_app", "users")
    const isTokens = await isTable("chat_app", "user_login_tokens")

    const user_sql = fs.readFileSync(path.join(path.resolve(), "sql", "users.schema.sql")).toString();
    const token_sql = fs.readFileSync(path.join(path.resolve(), "sql", "tokens.schema.sql")).toString();
    
    if (!isUsers) await execute(user_sql);
    if (!isTokens) await execute(token_sql);
}

async function isTokenValid(token = "") {
    if (!token) return false;
    const result = await execute("select * from user_login_tokens where token=?", [token]);
    return result.length > 0;
}

module.exports = {
    isTokenValid,
    setupDB,
    generateToken,
    addUser,
    hash,
    execute,
    wait,
    setCookieToken,
    performLogin,
    searchUser,
    isTable
}