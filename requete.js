// 2.1
db.livres.find({genre: "Science-Fiction"})

// 2.2
db.livres.find({annee_publication: {$lte: 1950}})

// 2.3
db.livres.find({disponible: true, note_moyenne: {$gte: 4.5}})

// 2.4
db.livres.find({nombre_pages: {$gte: 200, $lte: 400}})

//2.5
db.livres.aggregate([
     {
    $lookup: {
        from: "auteurs",
        localField: "auteur_id",
        foreignField: "_id",
        as: "auteur_info"
    }
    },
    {
    $match: {
        "auteur_info.nom": "Victor Hugo"
        }
    }   
])

//2.6
db.livres.find({tags: "Classique"})

//2.7
db.livres.find({disponible: true}).sort({note_moyenne: -1})

//2.8
db.livres.find({annee_publication: 1984})

//2.9
db.livres.find().sort({annee_publication: -1}).limit(5)

//2.10
db.livres.find({titre: /Guerre/i})

// -----------------------------------------------

//3.1
db.livres.aggregate({
    $group: {
        _id: "$genre",
        count: {$sum:"$genre"}
    }
})

//3.2
db.livres.aggregate([
    {
        $group: {
            _id: "$genre",
            note_moyenne: {$avg: "$note_moyenne"}
        }
    },
    {
        $sort: {note_moyenne: -1}
    }
])

//3.3
db.livres.aggregate([
    {
        $group: {
            _id: "$genre",
            total_page: {$sum: "$nombre_pages"}
        }
    }
])

//3.4
db.livres.find({}, { _id: 0, titre: 1, nombre_pages: 1 })
         .sort({ nombre_pages: -1 })
         .limit(3)

//3.5
db.livres.aggregate([
  {
    $project: {
      titre: 1,
      genre: 1,
      age: { $subtract: [2026, "$annee_publication"] }
    }
  },
  {
    $group: {
      _id: null,
      age_moyen: { $avg: "$age" }
    }
  }
])

//3.6
db.auteurs.find().sort({livres_ecrits: -1}).limit(1)

//3.7
db.livres.aggregate([
    {
        $project: {
            titre: 1,
            note_moyenne: {$avg: "$note_moyenne"}
        }
    },
])

//3.8
db.livres.find({titre: /^L/})

//3.9
db.livres.find({annee_publication: {$lte: 2026 - 50}})

//3.10
db.livres.find({disponible: true}).sort({nombre_pages: -1}).limit(5)

// ----------------------------------------------------------------

//4.1
db.livres.updateOne(
    {_id: ObjectId("66a000000000000000000002")}, 
    {$set: {disponible: false}}
)

//4.2
db.livres.updateOne(
    {_id: ObjectId("66a000000000000000000002")}, 
    {$inc: {note_moyenne: 0.5}}
)

//4.3
db.livres.updateMany(
    {genre: "Roman"}, 
    {$set: {genre: "Littérature"}}
)

// 4.4
const idsRetournes = db.emprunts.distinct("livre_id", { statut: "retourne" })

db.livres.updateMany(
  { _id: { $in: idsRetournes } },
  { $set: { disponible: true } }
)

//4.5
db.livres.updateOne(
     {_id: ObjectId("66a000000000000000000002")},
     {$set: {annee_publication: 1990}}
)

//4.6
const rowling = db.auteurs.findOne({ nom: "J.K. Rowling" })

db.livres.updateMany(
  { auteur_id: rowling._id },
  { $addToSet: { tags: "Bestseller" } }
)

//4.7
db.utilisateurs.updateOne(
    {_id: ObjectId('67b000000000000000000001')},
    {$inc: {nombre_emprunts: 1}}
)

//4.8
db.emprunts.updateMany(
  {
    statut: "en_cours",
    date_retour_prevue: { $lt: new Date() }
  },
  { $set: { statut: "retard" } }
)

//4.9
db.emprunts.updateOne(
  { _id: ObjectId("6aabd8c72e4177dd8f7e976c") },
  { $set: { date_retour_reelle: new Date() } }
)

//4.10
db.emprunts.updateMany(
  {
    date_retour_reelle: { $ne: null },
    $expr: { $lte: ["$date_retour_reelle", "$date_retour_prevue"] }
  },
  { $set: { amende: 0 } }
)

// ---------------------------------------------------------------------------

// 5.1
db.livres.deleteOne({_id: ObjectId('66a000000000000000000001'),})

//5.2
db.livres.deleteMany(
    {genre: "Poésie"}
)

//5.3
db.livres.deleteMany({ annee_publication: { $lt: 1900 } })

//5.4
db.emprunts.deleteMany({ statut: "annule" })

//5.5
const avecEmprunts = db.emprunts.distinct("utilisateur_id")

db.utilisateurs.deleteMany({ _id: { $nin: avecEmprunts } })

//5.6
db.livres.deleteMany({ auteur_id: null })

//5.7
db.emprunts.deleteMany({ utilisateur_id: ObjectId("67b000000000000000000002") })

//5.8
db.livres.deleteMany({ note_moyenne: { $lt: 2 } })

//5.9
const auteursAvecLivres = db.livres.distinct("auteur_id")

db.auteurs.deleteMany({ _id: { $nin: auteursAvecLivres } })

//5.10
db.emprunts.deleteMany({
  statut: "retourne",
  $expr: {
    $lt: [
      "$date_retour_reelle",
      { $dateSubtract: { startDate: "$$NOW", unit: "year", amount: 1 } }
    ]
  }
})

//---------------------------------------------------------------------------------------------------

// 6.1
db.livres.aggregate([
  {
    $lookup: {
      from: "auteurs",
      localField: "auteur_id",
      foreignField: "_id",
      as: "detail_auteur"
    }
  },
  {
    $project: {
      _id: 0,
      titre: 1,
      genre:1,
      nom: { $first: "$detail_auteur.nom" }
    }
  }
])

//6.2
db.emprunts.aggregate([
  {
    $lookup: {
      from: "livres",
      localField: "livre_id",
      foreignField: "_id",
      as: "livre"
    }
  },
  {
    $lookup: {
      from: "utilisateurs",
      localField: "utilisateur_id",
      foreignField: "_id",
      as: "utilisateur"
    }
  },
  {
    $project: {
      _id: 0,
      titre: { $first: "$livre.titre" },
      utilisateur: { $first: "$utilisateur.nom" },
      date_emprunt: 1,
      date_retour_prevue: 1
    }
  }
])

//6.3
db.utilisateurs.aggregate([
  {
    $lookup: {
      from: "emprunts",
      localField: "_id",
      foreignField: "utilisateur_id",
      as: "emprunts"
    }
  },
  { $unwind: "$emprunts" },
  { $match: { "emprunts.statut": "en_cours" } },
  {
    $group: {
      _id: "$_id",
      nom: { $first: "$nom" },
      email: { $first: "$email" },
      emprunts_en_cours: { $sum: 1 }
    }
  },
  { $project: { _id: 0, nom: 1, email: 1, emprunts_en_cours: 1 } },
])

//6.4
db.auteurs.aggregate([
  {
    $lookup: {
      from: "livres",
      localField: "_id",
      foreignField: "auteur_id",
      as: "livres"
    }
  },
  {
    $project: {
      _id: 0,
      nom: 1,
      "livres.titre": 1,
      "livres.annee_publication": 1
    }
  }
])

//6.5
db.livres.aggregate([
  { $match: { disponible: true } },
  {
    $lookup: {
      from: "auteurs",
      localField: "auteur_id",
      foreignField: "_id",
      as: "auteur"
    }
  },
  {
    $project: {
      _id: 0,
      titre: 1,
      auteur: { $first: "$auteur.nom" },
      note_moyenne: 1
    }
  }
])

//6.6
db.emprunts.aggregate([
  { $match: { statut: "retard" } },
  {
    $lookup: {
      from: "livres",
      localField: "livre_id",
      foreignField: "_id",
      as: "livre"
    }
  },
  {
    $lookup: {
      from: "utilisateurs",
      localField: "utilisateur_id",
      foreignField: "_id",
      as: "utilisateur"
    }
  },
  {
    $project: {
      _id: 0,
      titre: { $first: "$livre.titre" },
      utilisateur: { $first: "$utilisateur.nom" },
      date_emprunt: 1,
      date_retour_prevue: 1,
      amende: 1
    }
  },
  { $sort: { date_retour_prevue: 1 } }
])

//6.7
db.utilisateurs.aggregate([
  {
    $lookup: {
      from: "emprunts",
      localField: "_id",
      foreignField: "utilisateur_id",
      as: "emprunts"
    }
  },
  {
    $project: {
      _id: 0,
      nom: 1,
      total_emprunts: { $size: "$emprunts" }
    }
  },
  { $sort: { total_emprunts: -1, nom: 1 } }
])

//6.8
db.utilisateurs.aggregate([
  {
    $lookup: {
      from: "emprunts",
      localField: "_id",
      foreignField: "utilisateur_id",
      as: "emprunts"
    }
  },
  {
    $project: {
      _id: 0,
      nom: 1,
      total_emprunts: { $size: "$emprunts" }
    }
  }
])

//6.9
db.livres.aggregate([
  {
    $lookup: {
      from: "emprunts",
      localField: "_id",
      foreignField: "livre_id",
      as: "emprunts"
    }
  },
  {
    $group: {
      _id: "$auteur_id",
      total_emprunts: { $sum: { $size: "$emprunts" } }
    }
  },
  {
    $lookup: {
      from: "auteurs",
      localField: "_id",
      foreignField: "_id",
      as: "auteur"
    }
  },
  {
    $project: {
      _id: 0,
      nom: { $first: "$auteur.nom" },
      total_emprunts: 1
    }
  },
  { $sort: { total_emprunts: -1, nom: 1 } }
])

//6.10
db.livres.aggregate([
  {
    $group: {
      _id: "$genre",
      nombre_livres: { $sum: 1 },
      note_moyenne: { $avg: "$note_moyenne" }
    }
  },
  {
    $project: {
      _id: 0,
      genre: "$_id",
      nombre_livres: 1,
      note_moyenne: { $round: ["$note_moyenne", 2] }
    }
  },
  { $sort: { nombre_livres: -1, genre: 1 } }
])

//------------------------------------------------------------------------------------------------------

//7.1
db.emprunts.aggregate([
  {
    $group: {
      _id: "$utilisateur_id",
      total_amendes: { $sum: "$amende" }
    }
  },
  {
    $lookup: {
      from: "utilisateurs",
      localField: "_id",
      foreignField: "_id",
      as: "utilisateur"
    }
  },
  {
    $project: {
      _id: 0,
      nom: { $first: "$utilisateur.nom" },
      total_amendes: 1
    }
  },
  { $sort: { total_amendes: -1, nom: 1 } }
])

//7.2
db.emprunts.aggregate([
  { $match: { date_retour_reelle: { $ne: null } } },
  {
    $project: {
      livre_id: 1,
      duree_jours: {
        $dateDiff: {
          startDate: "$date_emprunt",
          endDate: "$date_retour_reelle",
          unit: "day"
        }
      }
    }
  },
  {
    $group: {
      _id: "$livre_id",
      duree_moyenne: { $avg: "$duree_jours" },
      nb_emprunts: { $sum: 1 }
    }
  },
  {
    $lookup: {
      from: "livres",
      localField: "_id",
      foreignField: "_id",
      as: "livre"
    }
  },
  {
    $project: {
      _id: 0,
      titre: { $first: "$livre.titre" },
      duree_moyenne: { $round: ["$duree_moyenne", 1] },
      nb_emprunts: 1
    }
  },
  { $sort: { duree_moyenne: -1 } }
])

//7.3
db.emprunts.aggregate([
  { $match: { date_retour_reelle: { $ne: null } } },
  {
    $project: {
      livre_id: 1,
      duree_jours: {
        $dateDiff: {
          startDate: "$date_emprunt",
          endDate: "$date_retour_reelle",
          unit: "day"
        }
      }
    }
  },
  {
    $group: {
      _id: "$livre_id",
      duree_moyenne: { $avg: "$duree_jours" },
      nb_emprunts: { $sum: 1 }
    }
  },
  {
    $lookup: {
      from: "livres",
      localField: "_id",
      foreignField: "_id",
      as: "livre"
    }
  },
  {
    $project: {
      _id: 0,
      titre: { $first: "$livre.titre" },
      duree_moyenne: { $round: ["$duree_moyenne", 1] },
      nb_emprunts: 1
    }
  },
  { $sort: { duree_moyenne: -1 } }
])

//7.4
db.emprunts.aggregate([
  {
    $group: {
      _id: "$livre_id",
      nb_emprunts: { $sum: 1 }
    }
  },
  { $sort: { nb_emprunts: -1 } },
  { $limit: 5 },
  {
    $lookup: {
      from: "livres",
      localField: "_id",
      foreignField: "_id",
      as: "livre"
    }
  },
  {
    $project: {
      _id: 0,
      titre: { $first: "$livre.titre" },
      nb_emprunts: 1
    }
  }
])

//7.5
db.emprunts.aggregate([
  {
    $group: {
      _id: "$utilisateur_id",
      nb_emprunts: { $sum: 1 }
    }
  },
  { $sort: { nb_emprunts: -1, _id: 1 } },
  { $limit: 5 },
  {
    $lookup: {
      from: "utilisateurs",
      localField: "_id",
      foreignField: "_id",
      as: "utilisateur"
    }
  },
  {
    $project: {
      _id: 0,
      nom: { $first: "$utilisateur.nom" },
      nb_emprunts: 1
    }
  }
])

//7.6
db.livres.find(
  {
    note_moyenne: { $gte: 4.5 },
    nombre_pages: { $gte: 300 }
  },
  { _id: 0, titre: 1, note_moyenne: 1, nombre_pages: 1 }
).sort({ note_moyenne: -1, nombre_pages: -1 })

//7.7
const auteursDispo = db.livres.distinct("auteur_id", { disponible: true })

db.auteurs.find(
  { _id: { $in: auteursDispo } },
  { _id: 0, nom: 1 }
)

//7.8
db.emprunts.aggregate([
  { $match: { date_retour_reelle: { $ne: null } } },
  {
    $project: {
      livre_id: 1,
      utilisateur_id: 1,
      date_emprunt: 1,
      date_retour_reelle: 1,
      duree_jours: {
        $dateDiff: {
          startDate: "$date_emprunt",
          endDate: "$date_retour_reelle",
          unit: "day"
        }
      }
    }
  },
  { $sort: { duree_jours: -1 } },
  { $limit: 3 },
  { $lookup: { from: "livres", localField: "livre_id", foreignField: "_id", as: "livre" } },
  { $lookup: { from: "utilisateurs", localField: "utilisateur_id", foreignField: "_id", as: "utilisateur" } },
  {
    $project: {
      _id: 0,
      titre: { $first: "$livre.titre" },
      utilisateur: { $first: "$utilisateur.nom" },
      date_emprunt: 1,
      date_retour_reelle: 1,
      duree_jours: 1
    }
  }
])

//7.9
const livresEmpruntes = db.emprunts.distinct("livre_id")

db.livres.find(
  { _id: { $nin: livresEmpruntes } },
  { _id: 0, titre: 1 }
)


//8.1
db.livres.find({
  tags: {$size: 3}
})

//8.2
db.livres
.find({ tags: "Classique"})
.limit(1)

//8.3