// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2021 S. K. Medlock, E. K. Herman, K. M. Shaw
// vim: set sts=4 shiftwidth=4 expandtab :
"use strict";

const fs = require('fs');
const adb = require('./adficeDB');

async function db_init() {
    if (!this.db) {
        this.db = await adb.init();
    }
    return this.db;
}

async function shutdown() {
    try {
        /* istanbul ignore else */
        if (this.db) {
            await this.db.close();
        }
    } finally {
        this.db = null;
    }
}

async function getAdviceForPatient(patient_id) {
    let sql = "SELECT * FROM patient_advice WHERE patient_id = ?";
    let params = [patient_id];

    let db = await this.db_init();
    let results = await db.sql_query(sql, params);

    return results;
}

function valportaal_init(db) {
    let valportaal = {
        /* private variables */
        db: db,

        /* "private" and "friend" member functions */
        db_init: db_init,

        /* public API methods */
        getAdviceForPatient: getAdviceForPatient,
        shutdown: shutdown,
    };
    return valportaal;
}

module.exports = {
    valportaal_init: valportaal_init,
};
