/* 
 * Environment for CODEditor
 */

CODEditor.Environment = (function(C,$,undefined){
	var _isEmbed;
	var _isExternalDomain;
	var _isPreview;
	var _container;
	var _containerType;

	var init = function(){
		_checkEmbed();
		_checkDomain();
		_checkContainer();
		_checkPreview();
	};

	var _checkEmbed = function(){
		_isEmbed = true;
		try {
			_isEmbed = (!(window.location === window.parent.location));
		} catch(e){}
		return _isEmbed;
	};

	var _checkDomain = function(){
		_isExternalDomain = false;

		if(_checkEmbed()){
			try {
				var parent = window.parent;
				while(parent!=window.top){
					if(typeof parent.location.href === "undefined"){
						_isExternalDomain = true;
						break;
					} else {
						parent = parent.parent;
					}
				}
				if(typeof window.top.location.href === "undefined"){
					_isExternalDomain = true;
				}
			} catch(e) {
				_isExternalDomain = true;
			}
		}
		return _isExternalDomain;
	};

	var _checkContainer = function(){
		_container = undefined;
		_containerType = "undefined";

		if((_isEmbed)&&(!_isExternalDomain)){
			try{
				switch(window.frameElement.tagName){
					case "OBJECT":
						_container = window.frameElement;
						_containerType = "OBJECT";
						break;
					case "IFRAME":
					default:
						_containerType = window.frameElement.tagName;
						_container = window.frameElement;
				}
			} catch (e){}
		}
	};

	var _checkPreview = function(){
		_isPreview = false;
		try {
			_isPreview = ((typeof window.parent.CODEditor.CORE.getPreview === "function")&&(CODEditor.File == window.parent.CODEditor.CORE.getPreview()));
		} catch(e){}
	};
	

	//////////////////////////
	// Getters and Setters
	//////////////////////////

	var isExternalDomain = function(){
		return _isExternalDomain;
	};

	var isEmbed = function(){
		return _isEmbed;
	};

	var getContainer = function(){
		return _container;
	};

	var getContainerType = function(){
		return _containerType;
	};

	var isPreview = function(){
		return _isPreview;
	};

	return {
		init			 : init,
		isExternalDomain : isExternalDomain,
		isEmbed 		 : isEmbed,
		isPreview		 : isPreview,
		getContainer	 : getContainer,
		getContainerType : getContainerType
	};

}) (CODEditor,jQuery);
