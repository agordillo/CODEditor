CODEditor.Utils = (function(C,$,undefined){

	var init = function(options){
		_defineExtraFunctions();
	};

	var _defineExtraFunctions = function(){
		//Extend JQuery functionality
		jQuery.fn.cssNumber = function(prop){
			var v = parseInt(this.css(prop),10);
			return isNaN(v) ? 0 : v;
		};
	};

	var isCodeEmpty = function(code){
		if((typeof code != "string")||(code.trim()==="")){
			return true;
		}
		return false;
	};


	return {
		init 			: init,
		isCodeEmpty		: isCodeEmpty
	};

}) (CODEditor,jQuery);