// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2021 S. K. Medlock, E. K. Herman, K. M. Shaw
// vim: set sts=4 shiftwidth=4 expandtab :
"use strict";

if (navigator.userAgent.includes("Node.js") ||
    navigator.userAgent.includes("jsdom")) {
} else {
    window.addEventListener('load', advicePageLoad);
}

async function advicePageLoad() {
    let params = new URLSearchParams(window.location.search)
    let id = params.get('id');

    if (id == null) {
        document.getElementById("body_wrap").innerHTML = "Klik hier om in te loggen<br><a href=\"login.html\"><button>Inloggen</button></a>";
        return;
    }

    let res = await fetch(`../advice?id=${id}`);
    let patient_json = await res.json();
    let med_advice = "Geen";
    let nonmed_advice = "Geen";
    let risk = "De gemiddelde kans van een val in de komende jaar bij mensen boven 70 jaar is 30%.";
    if (patient_json["patient_advice"] != undefined && Object.keys(patient_json["patient_advice"]).length > 0) {
        med_advice = createMedAdviceHTML(patient_json["patient_advice"][0]["json_advice"]);
        document.getElementById("med_advice").innerHTML = med_advice;
        nonmed_advice = createNonmedAdviceHTML(patient_json["patient_advice"][0]["json_advice"]);
        document.getElementById("nonmed_advice").innerHTML = nonmed_advice;
        //TODO add personalized risk graphic
        document.getElementById("risk").innerHTML = risk;
    } else {
        document.getElementById("body_wrap").innerHTML = "<p>Er is nog geen persoonlijk advies beschikbaar.</p>\nDit kan komen doordat:<br/>\n<ul>\n<li>\nU heeft nog geen afspraak gehad met uw arts. U zou een persoonlijk advies op dit pagina vinden na uw afspraak.<br/>\n</li>\n<li>\nUw doktor heeft uw advies nog niet goedgekeurd. Dit kan een tijdje duren, vooral als de doktor wacht nog op resultaten van bijvoorbeeld bloedonderzoeken.<br/>\nAls u een Valpoli afspraak hebt gehad en de doktor geeft aan dat u uw advies zullen vinden up deze portaal, neem dan kontact met de Valpoli op. \n</li>\n</ul>\n";
    }
};

//TODO this function is tested in the testcafe test, but should probably have a unit test too. advice.test.js doesn't exist yet.
function createMedAdviceHTML(json_advice) {
    let med_advice = "";
    let current_med_name = "";
    for (let i = 0; i < json_advice.length; ++i) {
        if (json_advice[i]["ATC_code"].match(/[A-Z][0-9].+/)) {
            let advice_text = formatAdvice(json_advice[i]["advice"], json_advice[i]["freetext"]);
            advice_text = "<div  class=\"med_advice_text\"><ul>" + advice_text + "</ul></div>";
            advice_text = advice_text.replace("<p>", "<li>");
            advice_text = advice_text.replace("</p>", "</li>");
            let med_name = json_advice[i]["medcat_name"];
            med_name = med_name.charAt(0).toUpperCase() + med_name.slice(1);
            let med_name_div = "";
            if (med_name !== current_med_name) {
                current_med_name = med_name;
                med_name_div = "<div id=\"div_med_name_" + json_advice[i]["ATC_code"] +
                    "\" class = \"med_name\">" +
                    med_name +
                    "</div>\n";
            }
            med_advice += med_name_div + advice_text;
        }
    }
    if (med_advice == "") {
        med_advice = "Geen"
    }
    return med_advice;
}

function createNonmedAdviceHTML(json_advice) {
    let nonmed_advice = "";
    let current_category_name = "";
    for (let i = 0; i < json_advice.length; ++i) {
        if (json_advice[i]["ATC_code"].match(/NONMED/)) {
            let advice_text = formatAdvice(json_advice[i]["advice"], json_advice[i]["freetext"]);
            advice_text = "<div  class=\"nonmed_advice_text\">" + advice_text + "</div>";
            let category_name = json_advice[i]["medcat_name"];
            let category_name_div = "";
            if (category_name !== current_category_name) {
                current_category_name = category_name;
                category_name_div = "<div id=\"div_category_name_" + category_name.substr(0, 3).replace("ë", "e") +
                    "\" class = \"category_name\">" +
                    category_name +
                    "</div>\n";
            }
            nonmed_advice += category_name_div + advice_text;
        }
    }
    if (nonmed_advice == "") {
        nonmed_advice = "Geen"
    }
    return nonmed_advice;
}

function formatAdvice(advice_text, freetext) {
    if (freetext == null) {
        freetext = "";
    }
    let md = new showdown.Converter();
    let formatted_advice = md.makeHtml(advice_text);
    let regex = /(\{\{free text.*\}\})/;
    formatted_advice = formatted_advice.replace(regex, freetext);
    return formatted_advice;
}
