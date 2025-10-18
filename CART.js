// gee_monthly_cart.js
// Minimal Google Earth Engine script: calculates SUI-like index and trains CART


var roi = /* color: #d63000 */ee.Geometry.Point([16.87, 41.12]); // replace with your area


// Load Sentinel-2 SR
var col = ee.ImageCollection('COPERNICUS/S2_SR')
.filterBounds(roi)
.filterDate('2021-07-01', '2021-07-31')
.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20));


// Simple SUI-like index: (SWIR - NIR) / (SWIR + NIR) using B11 and B8
function addSUI(img){
var sui = img.normalizedDifference(['B11','B8']).rename('SUI');
return img.addBands(sui);
}


var sample = col.map(addSUI).median().select(['B2','B3','B4','B8','B11','SUI']);


// Example training points (replace with your own FeatureCollection)
var urban = ee.FeatureCollection([ee.Feature(ee.Geometry.Point([16.87,41.12]), {class: 0})]);
var veg = ee.FeatureCollection([ee.Feature(ee.Geometry.Point([16.88,41.12]), {class: 1})]);


var training = urban.merge(veg).map(function(f){
return f.set('label', f.get('class'));
});


var upl = sample.sampleRegions({collection: training, properties: ['label'], scale: 10});


var classifier = ee.Classifier.smileCart().train({features: upl, classProperty: 'label', inputProperties: sample.bandNames()});


var classified = sample.classify(classifier);


Map.centerObject(roi,12);
Map.addLayer(sample, {bands:['B4','B3','B2'], max:3000}, 'median truecolor');
Map.addLayer(classified, {min:0, max:1, palette:['gray','green']}, 'classified');


print('Classifier', classifier);
