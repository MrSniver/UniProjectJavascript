//Dla grupy: jak bedziecie chieli stworzyc swoje wlasne bazy danych to musicie zmienic sobie dane w waszym pliku .env
//Tak zeby sie laczylo do waszej bazy danych a nie do mojej
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
})

async function createAndSeedDB() {
    try {
        //Creating tables in the database
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                nickname VARCHAR(50) UNIQUE,
                age_verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                currency INTEGER DEFAULT 0,
                banned boolean DEFAULT FALSE
            );
        `)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS roles (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(50) UNIQUE NOT NULL
            );
        `)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_roles (
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
                PRIMARY KEY (user_id, role_id)
            );
        `)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS payment_info (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                card_number VARCHAR(50) UNIQUE NOT NULL,
                ccv VARCHAR(50) NOT NULL,
                card_date VARCHAR(10) NOT NULL,
                card_holder VARCHAR(100) NOT NULL,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE
                );
        `)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS payment_history (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                payed_amount INTEGER NOT NULL,
                payment_type VARCHAR(50) NOT NULL,
                bought_currency INTEGER NOT NULL,
                payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
        `)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS game_history (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                game_type VARCHAR(50) NOT NULL,
                game_status VARCHAR(50) NOT NULL,
                won_amount INTEGER NOT NULL,
                created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
        `)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS audit_log (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                status INTEGER NOT NULL,
                event VARCHAR(255) NOT NULL,
                error VARCHAR(255),
                created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by UUID NOT NULL
                );
        `)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ban_list (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                reason VARCHAR(255) NOT NULL,
                description VARCHAR(255) NOT NULL,
                ban_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ban_to TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '5 minutes',
                created_by UUID NOT NULL,
                is_deleted BOOLEAN DEFAULT FALSE
                );
            `)

        //zhashowane haslo to stickyjohn15
        //Seeding data into database
        await pool.query(`
            INSERT INTO users(id, username, email, password_hash, age_verified, created_at, last_modified, banned) VALUES
                ('cc6c2fbe-282c-4d9c-ada2-5394329cebb9', 'adam', 'adam@testmail.com', '"$2b$10$oX15JPNS12Z3ldu0/Hr8meQx1pIe1KoW0h7.W9kErkFaJN4eDMvIq"', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE),
                ('dd7d3fce-393d-5e0d-beb3-640543adfcc0', 'eva', 'eva@testmail.com', '"$2b$10$z/SEfvTRArbzOcKpj1yGBOYZ9.x/Vwy7g9MjIsNXY/..04J6oTbay"', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE
                );
        `)
        await pool.query(`
            INSERT INTO roles(id, name) VALUES
                ('1a2b3c4d-1111-2222-3333-444455556666', 'admin'),
                ('2b3c4d5e-2222-3333-4444-555566667777', 'user'
                );
        `)
        await pool.query(`
            INSERT INTO user_roles(user_id, role_id) VALUES
                ('cc6c2fbe-282c-4d9c-ada2-5394329cebb9', '1a2b3c4d-1111-2222-3333-444455556666'),
                ('dd7d3fce-393d-5e0d-beb3-640543adfcc0', '2b3c4d5e-2222-3333-4444-555566667777'
                );
        `)
    } catch (error) {
        console.error("Error creating or seeding database:", error);
    } finally {
        await pool.end();
    }
}

createAndSeedDB();