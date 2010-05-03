/*
---

script: Element.Measure.js

description: Extends the Element native object to include methods useful in measuring dimensions.

credits: "Element.measure / .expose methods by Daniel Steigerwald License: MIT-style license. Copyright: Copyright (c) 2008 Daniel Steigerwald, daniel.steigerwald.cz"

license: MIT-style license

authors:
- Aaron Newton

requires: [Core/Element.Style, Core/Element.Dimensions, MooTools.More]

provides: [Element.Measure]

...
*/

(function(){

// Gets a list of styles. For instance if you ask for border it will get border-width styles.
var calculateStylesList = function(styles, planes){
	var list = [];
	$each(planes, function(directions){
		$each(directions, function(edge){
			styles.each(function(style){
				if (style == 'border') list.push(style + '-' + edge + '-width');
				else list.push(style + '-' + edge);
			});
		});
	});
	return list;
};

// Gets a size of an edge - padding, border, whatever.
var calculateEdgeSize = function(edge, styles){
	var total = 0;
	$each(styles, function(value, style){
		if (style.test(edge)){
			total += value.toInt();
		}
	});
	return total;
};

// Plane: width or height
// Edges: [left, right] or [top, bottom]
// Styles: An array of styles
var calculatePlaneSize = function(el, plane, edges, styles){
	
	console.log(el);
	
	var total = 0;
	
	$each(styles, function(value, style){
		edges.each(function(property){
			if (style.test(property)){
				total += value.toInt();
			}
		});
	});
	
	total += el.getComputedStyle(plane).toInt();
	console.log(total);
	
	return total;
	
};

Element.implement({

	measure: function(fn){
		var vis = function(el) {
			return !!(!el || el.offsetHeight || el.offsetWidth);
		};
		if (vis(this)) return fn.apply(this);
		var parent = this.getParent(),
			restorers = [],
			toMeasure = []; 
		while (!vis(parent) && parent != document.body) {
			toMeasure.push(parent.expose());
			parent = parent.getParent();
		}
		var restore = this.expose();
		var result = fn.apply(this);
		restore();
		toMeasure.each(function(restore){
			restore();
		});
		return result;
	},

	expose: function(){
		if (this.getStyle('display') != 'none') return $empty;
		var before = this.style.cssText;
		this.setStyles({
			display: 'block',
			position: 'absolute',
			visibility: 'hidden'
		});
		return function(){
			this.style.cssText = before;
		}.bind(this);
	},

	getDimensions: function(options){
		options = $merge({computeSize: false}, options);
		var dim = {};
		var getSize = function(el, options){
			return (options.computeSize) ? el.getComputedSize(options) : el.getSize();
		};
		var parent = this.getParent('body');
		if (parent && this.getStyle('display') == 'none'){
			dim = this.measure(function(){
				return getSize(this, options);
			});
		} else if (parent){
			try { //safari sometimes crashes here, so catch it
				dim = getSize(this, options);
			}catch(e){}
		} else {
			dim = {x: 0, y: 0};
		}
		return $chk(dim.x) ? $extend(dim, {width: dim.x, height: dim.y}) : $extend(dim, {x: dim.width, y: dim.height});
	},

	getComputedSize: function(options){
	
		options = $merge({
			styles: ['padding','border'],
			planes: {
				height: ['top','bottom'],
				width: ['left','right']
			},
			mode: 'both'
		}, options);
		
		switch (options.mode){
			case 'vertical':
				delete size.width;
				delete options.planes.width;
				break;
			case 'horizontal':
				delete size.height;
				delete options.planes.height;
				break;
		}

		var size = {width: 0, height: 0},
			stylesToGet = calculateStylesList(options.styles, options.planes),
			styles = {};
		

		stylesToGet.each(function(style){
			styles[style] = this.getComputedStyle(style).toInt();
		}, this);

		var getStyles = stylesToGet;		
		var subtracted = [];
		
		$each(options.planes, function(plane, key){ //keys: width, height, planes: ['left', 'right'], ['top','bottom']
			
			var capitalized = key.capitalize();
			
			size['total' + capitalized] = size['computed' + capitalized] = 0;
			
			plane.each(function(edge){ //top, left, right, bottom
				
				size['computed' + edge.capitalize()] = calculateEdgeSize(edge, styles);
				
				getStyles.each(function(style, i){ //padding, border, etc.
					if (style.test(edge)){
						size['total' + capitalized] = size['total' + capitalized] + styles[style];
					}
				});
			});
			
		});

		['Width', 'Height'].each(function(value){
			var lower = value.toLowerCase();
			if(!$chk(size[lower])) return;

			size[lower] = size[lower] + this['offset' + value] + size['computed' + value];
			size['total' + value] = size[lower] + size['total' + value];
			delete size['computed' + value];
		}, this);

		return $extend(styles, size);
	}

});

})();