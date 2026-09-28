const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const pool = require('./config/db');

async function importarDatos() {
    console.log("🚀 Iniciando importación...");

    // 1. Importar Comida
    const rutaComida = path.resolve(__dirname, 'DB_comida.csv');
    fs.createReadStream(rutaComida)
        .pipe(csv.parse({ headers: true }))
        .on('data', async (row) => {
            try {
                await pool.query(
                    `INSERT INTO catalogo_comida (nombre, grupo_nutricional, cantidad_base, unidad_medida, calorias_kcal, proteina_g, lipidos_g, carbohidratos_g) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [row.nombre, row.grupo_nutricional, row.cantidad_base, row.unidad_medida, row.calorias_kcal, row.proteina_g, row.lipidos_g, row.carbohidratos_g]
                );
            } catch (err) { console.error("Error en fila comida:", err.message); }
        })
        .on('end', () => console.log("✅ Catálogo de comida cargado."));

    // 2. Importar Ejercicios
    const rutaEjercicios = path.resolve(__dirname, 'DBejercicios.csv');
    fs.createReadStream(rutaEjercicios)
        .pipe(csv.parse({ headers: true }))
        .on('data', async (row) => {
            try {
                await pool.query(
                    `INSERT INTO catalogo_ejercicios (parte_cuerpo, tipo_musculo, ejercicio, series, repeticiones) 
                     VALUES ($1, $2, $3, $4, $5)`,
                    [row['Parte del cuerpo'], row['Tipo de músculo'], row.Ejercicio, row.Series, row['Repeticiones por serie']]
                );
            } catch (err) { console.error("Error en fila ejercicio:", err.message); }
        })
        .on('end', () => console.log("✅ Catálogo de ejercicios cargado."));
}

importarDatos();