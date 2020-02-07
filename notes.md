# Notes Projet

## Liens utiles
### tuto QGIS géoréférencement
https://docs.qgis.org/2.8/fr/docs/user_manual/plugins/plugins_georeferencer.html


### OpenData Bati
1. OpenData APUR : http://opendata.apur.org/search 
1. Bati Paris + année ou période construction : http://opendata.apur.org/datasets/emprise-batie-paris?geometry=2.334%2C48.857%2C2.360%2C48.861
2. Bati Paris hauteur : http://opendata.apur.org/datasets/hauteur-bati-2012?geometry=2.236%2C48.828%2C2.446%2C48.867
1. Voie Paris : http://opendata.apur.org/datasets/voie?geometry=2.327%2C48.856%2C2.379%2C48.866 


## Protocole
1. Géoréférencement de la carte Turgot : (QGIS)
    1. Saisir de points de contrôle entre la carte et un fond OSM : SRC Lambert93 (ESPG:2154)
    1. Appliquer le géoréférencement avec :
        * traitement projective
        * compression LTZ
        * application de la transparence
    1. Enregistrer en `geoTIF`
1. Appliquer le `geoTIF` en texture d'un `plane` de THREE.js
2. Créer un échantillon de bâtiment : (QGIS)
    1. Saisir dans un shapefile (`ground.shp`), les arêtes au sol des bâtiments (de gauche à droite dans le sens de la carte de Turgot)
    1. Saisir dans un autre shapefile (`sky.shp`), les arêtes du haut des bâtiments (de gauche à droite dans le sens de la carte de Turgot).
    * **Note :** une arête _ground_ et une arête _sky_ correspondant au même bâtiment, doivent avoir le même identifiant dans leur shape respectif.
3. Convertir les échantillons de bâtiment en `geoJSON` (avec GDAL ?).
1. Dans THREE.js, parser le `geoJSON` pour au moins avoir le plat des bâtiments avce le `ground`.
2. Calculer la distance entre les _ground_ et les _sky_ pour avoir le z (altitude) à appliquer sur les _sky_. 
1. Les (x,y) des _ground_ seront les coordonnées (x,y) pour les _ground_ et les _sky_. 