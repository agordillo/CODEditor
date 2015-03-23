CODEditor.I18n = (function(C,$,undefined){
	
	var _language;
	var _translations;

	var _defaultLanguage = "en";
	var _defaultTranslations;
	
	/**
	 * Function to perform the language translation
	 */
	var init = function(lang){
		var i18n = CODEditor_i18n;
		_defaultTranslations = i18n[_defaultLanguage];

		// if((typeof lang != "string")||(typeof i18n[lang] != "object")){
		// 	//Try to infer language from browser
		// 	var userLang = navigator.language || navigator.userLanguage;
		// 	if(typeof userLang == "string"){
		// 		lang = userLang;
		// 	}
		// }

		//Set language
		if((typeof lang == "string")&&(typeof i18n[lang] == "object")){
			_language = lang;
			_translations = i18n[lang];
		} else {
			//Set default language
			_language = _defaultLanguage;
			_translations = _defaultTranslations;
		}
		
		$("[i18n-key]").each(function(index, elem){
			var translation = getTrans($(elem).attr("i18n-key"));
			if(typeof translation == "string"){
				switch(elem.tagName){
					 case "INPUT":
					 	_translateInput(elem,translation);
					 	break;
					 case "TEXTAREA":
					 	_translateTextArea(elem,translation);
					 	break;
					 case "IMG":
					 	_translateImg(elem,translation);
					default:
						_genericTranslate(elem,translation);
						break;
				}
			}
		});

		$("[i18n-key-title]").each(function(index, elem){
			var translation = getTrans($(elem).attr("i18n-key-title"));
			if(typeof translation == "string"){
				_translateTitle(elem,translation);
			}
		});
	};
		
	var _translateInput = function(input,translation){
		_translatePlaceholder(input,translation);
	};

	var _translateTextArea = function(textArea,translation){
		_translatePlaceholder(input,translation);
	};

	var _translateImg = function(img,translation){
		$(img).attr("src","img/" + translation);
	};

	var _translateTitle = function(elem,translation){
		$(elem).attr("title", translation);
	};

	var _translatePlaceholder = function(elem,translation){
		$(elem).attr("placeholder", translation);
	};

	var _genericTranslate = function(elem,translation){
		$(elem).text(translation);
	};

	/**
	 * Function to translate a text
	 */
	var getTrans = function(s, params) {
		if ((typeof(_translations) != 'undefined') && (typeof _translations[s] == "string")) {
			return _getTrans(_translations[s],params);
		}

		//Search in default language
		if ((typeof(_defaultTranslations) != 'undefined') && (typeof _defaultTranslations[s] == "string")) {
			return _getTrans(_defaultTranslations[s],params);
		}
		
		//Don't return s if s is a key.
		var key_pattern =/^i\./g;
		if(key_pattern.exec(s)!=null){
			return null;
		} else {
			return s;
		}
	};

	/*
	 * Replace params (if they are provided) in the translations keys. Example:
	 * // "i.dtest"	: "Created by #{name} with CODEditor",
	 * // CODEditor.I18n.getTrans("i.dtest", {name: "Aldo"}) -> "Created by Aldo with CODEditor"
	 */
	var _getTrans = function(trans, params){
		if(typeof params != "object"){
			return trans;
		}

		for(var key in params){
			var stringToReplace = "#{" + key + "}";
			if(trans.indexOf(stringToReplace)!=-1){
				trans = trans.replaceAll(stringToReplace,params[key]);
			}
		};

		return trans;
	};

	/**
	 * Return the current language
	 */
	var getLanguage = function(){
		return _language;
	};


	return {
		init 			: init,
		getTrans 		: getTrans,
		getLanguage		: getLanguage
	};

}) (CODEditor, jQuery);
