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

[Documentation détaillée](https://ben365.github.io/ouestmonbus/docs/)

## ouestmonbus.com en application mobile ##

ouestmonbus.com est un site web qui fonctionne sur mobile (avec un navigateur, chrome ou safari par exemple).

On m’a sollicité plusieurs fois pour le transformer en application mobile.

Je ne pense pas le faire car le site fonctionne déjà sur mobile sans avoir besoin de passer par une appli (et je n'ai plus beaucoup de temps libre en ce moment).

J’ai réalisé ce projet, pour mon usage personnel, je prends le bus au quotidien, et la version sous forme de site web me convient très bien.

J’ai développé ce projet en rendant le code source libre, sous licence GPL, ce qui signifie que vous avez le droit de copier/modifier/distribuer/vendre ce projet en respectant certaines conditions comme:

* garder le projet libre
* distribuer le code source modifié
* ..

Voir [Licence publique générale GNU sur Wikipedia](https://fr.wikipedia.org/wiki/Licence_publique_g%C3%A9n%C3%A9rale_GNU) et [Guide rapide de la GPLv3](http://www.gnu.org/licenses/quick-guide-gplv3.fr.html).

Pour moi ça reste dans la philosophie de toutes les librairies que j’ai utilisé pour faire ce site, à savoir (Leaflet, Metro UI CSS, jQuery,…) et les données que j’utilise c’est à dire OpenStreetMap et l’opendata de Data Keolis Rennes Métropole.

Je vous encourage donc à faire l’application mobile si vous le souhaitez.

Il est possible de faire un wrapper (c’est à dire une appli qui va juste afficher la page web), je l’ai expérimenté avec le service [gonative.io](https://gonative.io/), ça fonctionne: https://gonative.io/share/qlmya.

Cependant, en pratique il y a quelques soucis, en général quand vous êtes à un arrêt de bus, vous n’êtes pas seul, et la bande passante disponible sur le smartphone peut ne pas être suffisante pour afficher ouestmonbus.com (surtout en zone sans 4G ou/et aux heures de pointe, ça m'est arrivé plusieurs fois).

ouestmonbus.com demande beaucoup de bande passante, une solution serait de mettre en cache des données (les scripts, la carte, les arrêts, etc..), mais c’est plus long à faire qu’un simple wrapper.

Ami(e)s hacker / codeur si ça vous tente, le code est libre :-)

Pour débugger/analyser le site, un astuce allez sur http://ouestmonbus.com/src/ (version sans compression) et le code source de l'application est ici ou là.
