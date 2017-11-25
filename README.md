# Où est mon bus ? OpenStreetMap et OpenData #

Où est mon bus ? est une carte interactive en ligne basée sur OpenStreetMap et les données OpenData de Rennes Métropole.

L'application indique les arrêts de bus en temps réel.

En cliquant sur les arrêts de bus, les prochains passages des lignes sont affichés en direct en précisant un éventuel retard ou avance.

La position des bus est indiquée sur la carte avec un rafraîchissement automatique toutes les minutes.
Caractéristiques principales :

* arrêts de bus affichés aux arrêts en temps réel, si un bus est prévu dans la journée.
* affichage des deux prochains passages de bus en temps réel sur les arrêts.
* affichage de la position des bus sur la carte.
* géolocalisation automatique ou avec saisie d'un lieu référencé sur OpenStreetMap (avec auto-complétion).
* informations @starbusmetro en temps réel.
   * partage de liens avec localisation.
   * consultation des fiches horaires officielles via les icônes des lignes.
   * détails de la carte OpenStreetMap complets jusqu'au zoom maximum.

Où est mon bus ? est une application simple et rapide pour ne plus rater son bus !

Elle peut être utilisée sans installation, simplement en se rendant sur le site ouestmonbus.com depuis un ordinateur, mobile ou tablette.

## Mise à jour des données sur ouestmonbus.com ##

Keolis Rennes publie des mises à jour de données (GTFS pour les passages théoriques et la position des stations) via un flux RSS, la mise à jour se fait via un script automatique qui utilise [un container docker](https://github.com/ben365/ouestmonbus/blob/master/Dockerfile):

   `docker run ouestmonbus /ouestmonbus/generator/gen.sh [nb de jour à générer]`

## ouestmonbus.com en application mobile ##

ouestmonbus.com est un site web qui fonctionne sur mobile (avec un navigateur, chrome ou safari par exemple), il est [responsive  design](https://fr.wikipedia.org/wiki/Site_web_adaptatif)

Il est possible de faire un wrapper (c’est à dire une appli qui va juste afficher la page web), je l’ai expérimenté avec le service [gonative.io](https://gonative.io/), ça fonctionne: https://gonative.io/share/qlmya.

Vous pouvez telecharger la version application sur [gonative.io](https://gonative.io/share/qlmya), il n'est pas prévu de publier cette application sur les stores d'applications.

## Documentation détaillée ##

https://ben365.github.io/ouestmonbus/docs/
