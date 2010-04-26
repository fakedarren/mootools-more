/*
---

script: MooTools.Lang.js

description: Provides methods for localization.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Events
- /MooTools.More

provides: [MooTools.Lang]

...
*/

(function(){
	
	// maybe data should be a reference to this? this.language etc as opposed to data.language?
	// Or defaults. Not sure.
	var data = {
		language: 'en-US',
		languages: {
			'en-US': {}
		},
		cascades: ['en-US']
	};
	
	var cascaded;

	MooTools.lang = new Events();

	$extend(MooTools.lang, {

		setLanguage: function(lang){
			if (!data.languages[lang]) return this;
			data.language = lang;
			this.loadLanguage();
			// renamed to languageChange, more verbose but meh
			this.fireEvent('languageChange', lang);
			return this;
		},
		
		// renamed to loadLanguage as more verbose
		loadLanguage: function() {
			var langs = this.cascade(this.getCurrentLanguage());
			cascaded = {};
			Object.each(langs, function(set, setName){
				// Don't think we should have method names like this
				// Close to $lambda so confusing
				cascaded[setName] = this.lambda(set);
			}, this);
		},

		getCurrentLanguage: function(){
			return data.language;
		},

		addLanguage: function(lang){
			data.languages[lang] = data.languages[lang] || {};
			return this;
		},

		cascade: function(lang){
			var cascades = (data.languages[lang] || {}).cascades || [];
			cascades.combine(data.cascades);
			cascades.erase(lang).push(lang);
			var langs = cascades.map(function(lng){
				return data.languages[lng];
			}, this);
			return $merge.apply(this, langs);
		},

		lambda: function(set) {
			(set || {}).get = function(key, args){
				// This line needs cleaning up, it's confusing I think
				return $lambda(set[key]).apply(this, $splat(args));
			};
			return set;
		},

		get: function(set, key, args){
			// Conditional and ternary on one line is confusing
			if (cascaded && cascaded[set]) return (key ? cascaded[set].get(key, args) : cascaded[set]);
		},

		set: function(lang, set, members){
			this.addLanguage(lang);
			langData = data.languages[lang];
			if (!langData[set]) langData[set] = {};
			$extend(langData[set], members);
			if (lang == this.getCurrentLanguage()){
				this.loadLanguage();
				this.fireEvent('languageChange', lang);
			}
			return this;
		},

		list: function(){
			return Hash.getKeys(data.languages);
		}

	});

})();