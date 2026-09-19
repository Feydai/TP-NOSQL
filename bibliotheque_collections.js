db = db.getSiblingDB("bibliotheque");

// 1.1 Création des collections
db.createCollection("auteurs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nom", "nationalite", "annee_naissance"],
      properties: {
        _id:             { bsonType: "objectId" },
        nom:             { bsonType: "string", description: "Nom complet de l'auteur" },
        nationalite:     { bsonType: "string", description: "Pays d'origine" },
        annee_naissance: { bsonType: "number" },
        annee_deces:     { bsonType: "number", description: "Absent si l'auteur est vivant" },
        biographie:      { bsonType: "string" },
        livres_ecrits:   { bsonType: "number", minimum: 0 }
      }
    }
  }
});

db.createCollection("livres", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["titre", "auteur_id", "annee_publication", "genre", "disponible"],
      properties: {
        _id:               { bsonType: "objectId" },
        titre:             { bsonType: "string" },
        auteur_id:         { bsonType: "objectId", description: "Référence -> auteurs._id" },
        annee_publication: { bsonType: "number" },
        genre:             { bsonType: "string" },
        nombre_pages:      { bsonType: "number", minimum: 1 },
        langue:            { bsonType: "string" },
        editeur:           { bsonType: "string" },
        disponible:        { bsonType: "bool" },
        note_moyenne:      { bsonType: "number", minimum: 0, maximum: 5 },
        date_ajout:        { bsonType: "date" },
        tags:              { bsonType: "array", items: { bsonType: "string" } }
      }
    }
  }
});

db.createCollection("utilisateurs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nom", "email", "type", "date_inscription"],
      properties: {
        _id:              { bsonType: "objectId" },
        nom:              { bsonType: "string" },
        email:            { bsonType: "string", pattern: "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$" },
        type:             { enum: ["Étudiant", "Professeur", "Membre"] },
        date_inscription: { bsonType: "date" },
        nombre_emprunts:  { bsonType: "number", minimum: 0 },
        abonnements:      { bsonType: "array", items: { bsonType: "string" } }
      }
    }
  }
});

db.createCollection("emprunts", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["livre_id", "utilisateur_id", "date_emprunt", "date_retour_prevue", "statut"],
      properties: {
        _id:                { bsonType: "objectId" },
        livre_id:           { bsonType: "objectId", description: "Référence -> livres._id" },
        utilisateur_id:     { bsonType: "objectId", description: "Référence -> utilisateurs._id" },
        date_emprunt:       { bsonType: "date" },
        date_retour_prevue: { bsonType: "date" },
        date_retour_reelle: { bsonType: ["date", "null"], description: "null / absent si non retourné" },
        statut:             { enum: ["en_cours", "retourne", "retard", "annule"] },
        amende:             { bsonType: "number", minimum: 0 }
      }
    }
  }
});