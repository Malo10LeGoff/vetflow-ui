Tu es un product designer + software architect senior, spécialisé dans les SaaS B2B médicaux.
Ta mission est de concevoir un SaaS complet, destiné aux cliniques vétérinaires équines, pour la gestion et le suivi des hospitalisations de chevaux.

Le produit doit être pensé comme un outil de travail quotidien, utilisé plusieurs fois par jour, par des vétérinaires, ASV et le personnel administratif.

L'application doit être codé en NextJs, et avoir une couche d'abstraction quand elle appelle le backend, pcq tu vas commencer par mocker la data (nous remplacerons après avec des vrais call backend).

Le SaaS doit inclure les pages suivantes, avec une description claire du contenu, des fonctionnalités et de la logique métier.

1. Page de connexion

Objectif: Permettre un accès sécurisé et rapide pour le personnel de la clinique.

Contenu
- Authentification par email + mot de passe --> Hardcode le à malolegoff@gmail.com + malo1997 pour l'instant

Après la page de connexion, toutes les pages ont une side navbar avec 6 pages:
- Page d'accueil
- Page fiche patient (Tableau de soin hospitalier)
- Ajout d'un patient en hospitalisation
- Tableau des fiches patients déjà traités (i.e archives)
- Templates d'hospitalisation (colique, ...)
- Base de données de médicaments

2. Page d’accueil — Tableau de bord hospitalisation

Objectif: Donner une vue globale instantanée de tous les chevaux hospitalisés.

Contenu
- Voir la liste des chevaux actuellement hospitalisés
    Pour chaque cheval afficher :
    - nom du cheval
    - nom du propriétaire
    - âge
    - durée d’hospitalisation (en jours / heures)
    - catégorie clinique (chirurgie, colique, soins intensifs, poulain, etc.)
    - heure du prochain examen clinique ou traitement prévu

Fonctionnalités
- Possibilité d’archiver un dossier de cheval sans le supprimer. Une autre page récupèrera ces dossiers
- Filtres par catégorie
- Tri par urgence, durée d’hospitalisation ou prochain acte
- Lorsqu'on clique sur "Voir fiche", ça nous enmène sur la 3eme page: le tableau de soins hospitalier pour le cheval sur lequel on a cliqué

3. Page fiche patient — Tableau de soins hospitaliers (Tableau horaire)

Objectif: Centraliser l’intégralité du suivi clinique du cheval sur une seule page.

Contenu. Vue en tableau :
- Colonnes = heures (ex : toutes les heures sur 24h, extensible sur plusieurs jours)
- Lignes = catégories cliniques
Toutes cases est éditable, de manière différente suivant le type de la case

Catégories possibles
- Température
- Fréquence cardiaque
- Fréquence respiratoire
- Attitude
- Douleur
- Perfusions
- Médicaments. Pour les médicaments, il y a une list de medocs de base dans l'app qui est éditable par l'utilisateur (nom du médoc et unité de reférence). L'utilisateur peut choisir les medocs qu'il veut mettre dans le tableau horaire et mettre la dose qu'il veut
- Observations libres

ça ressemble à ça:

Cheval : VULCAIN        Poids : 520 kg
Hospitalisé depuis : 1j 6h
------------------------------------------------------------

                08h   09h   10h   11h   12h   13h   14h
------------------------------------------------------------
Température     38.1  38.3  38.9  🔴39.2  38.7  38.4  38.2
FC (bpm)         42    44    48    52     46    44    42
Douleur          +     ++    ++    +++    ++     +     +
Attitude        alerte agité agité doul.  calme  calme  calme
Perfusion       ✔︎     ✔︎     ✔︎     ✔︎     ✔︎     ✔︎     ✔︎
Flunixine (ml)           10ml                    10ml
Observations           JD                   colique +

Fonctionnalités
- Remplissage des cellules via : menus déroulants, champs courts (initiales, commentaires)
- Clic sur une cellule numérique (ex : température) --> affichage d’un graphique montrant : l’évolution sur toute la durée d’hospitalisation. Graphiques disponibles pour toutes les données numériques
- On peut rajouter des actions répétées au tableau (pax tous les jours à minuit pdt 3j, on lui envoie medoc X au dosage Y)
- boutton "Résumé" qui compte le nb de médicaments et du matériel qui a été utilisé jusqu'à lors par la clinique pendant l'hospitalisation du cheval. Ce sera éditable par les utilisateurs. Possibilité d'exporter en pdf
- On peut voir la liste des matériels utilisés pendant le séjour, ainsi qu'en ajouter (par ex pour ajouter un perfuseur de plus)

4. Ajout d'un animal

Contenu: Formulaire avec:
- nom du cheval
- nom du propriétaire
- âge --> possibilité de donner en année ou en mois, on le convertit en année dans le backend
- durée d’hospitalisation (en jours / heures) (>0)
- catégorie clinique (chirurgie, colique, soins intensifs, poulain, etc.) --> Choix d'utilisation d'un template
- Poids d'entrée (>0)
- Date d'admission

Une fois ajouté avec succès, l'utilisateur est envoyé sur la fiche patient qui vient donc d'être créée 

5. Page avec les templates cliniques

Objectif: Standardiser les soins et gagner du temps selon les cas cliniques. Au moment ou le cheval est admis dans la clinique, on sait déjà si il a une coloqie, castration, ... Donc on applique un template qui pré-remplit l'hospitalisation

Contenu: Liste des templates existants (il y a des templates par défaut qui sont disponibles)

Fonctionnalités
- Création et gestion de templates par la clinique

Chaque template inclut :
- les catégories cliniques à surveiller (température, douleur, attitude, transit, ...).
- les actes à réaliser (par ex: prendre la T toutes les 2h)
- les traitements standards (médicaments et doses pré-remplies en fonction du cheval)
Donc pour l'instant c'est les lignes du tableau horaire de la fiche patient définit en 3.
- la liste du matériel utilisé (tubes, cathéters, perfuseurs, ...)

Les templates peuvent être créé/modifiés par la clinique 

6. Archives

Contenu: La liste des animaux déjà traités, (paginé) avec une page de 10, ordered by recency et on a une barre de recherche pour trouver le nom du cheval

7. Base de données de médicaments

Contenu: Liste des médicaments, avec leur unité de référence. Editable par les utilisateurs, ils peuvent ajouter, modifier un des medocs