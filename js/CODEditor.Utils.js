CODEditor.Utils = (function(C,$,undefined){

	var _fileSaverSupported = false;
	var _isFileReaderSupported = false;
	var _localStorageSupported = false;

	var init = function(options){
		_defineExtraFunctions();

		//Feature and support detection
		_checkFileSaverSupport();
		_checkFileReaderSupport();
		_checkLocalStorageSupport();
	};

	var _defineExtraFunctions = function(){
		//Extend JQuery functionality
		jQuery.fn.cssNumber = function(prop){
			var v = parseInt(this.css(prop),10);
			return isNaN(v) ? 0 : v;
		};
	};

	var moveElementInArray = function(array, fromIndex, toIndex) {
		var element = array[fromIndex];
		array.splice(fromIndex, 1);
		array.splice(toIndex, 0, element);
	};

	var getAgesFromAgeRange = function(ageRange){
		var ageRanges = [0,0];
		if(typeof ageRange != "string"){
			return ageRanges;
		}
		var ageRangeArray = ageRange.split("-");
		var ageMin = parseInt(ageRangeArray[0]);
		var ageMax = parseInt(ageRangeArray[1]);
		if(jQuery.isNumeric(ageMin)&&jQuery.isNumeric(ageMax)){
			ageRanges = [ageMin,ageMax];
		}
		return ageRanges;
	};

	var isCodeEmpty = function(code){
		if((typeof code != "string")||(code.trim()==="")){
			return true;
		}

		//Remove text in comments
		switch(C.CORE.getCurrentEditorMode()){
			case "HTML":
				break;
			case "JavaScript":
				code = code.replace(/\/\*([\*\n\s\wáéíóúÁÉÍÓÚç¡!ªº\"#~%&()=\[\]\^{}<>$'`,;\-+_\?\¿\."])*\*\//, "")
				break;
			default:
				break;
		}

		if((typeof code != "string")||(code.trim()==="")){
			return true;
		}

		return false;
	};

	/*
	 * Text that can contain HTML but is expected to be plain text.
	 */
	var purgeTextString = function(text){
		if(typeof text !== "string"){
			return text;
		}
		return text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&lt;b&gt;/g, '<b>').replace(/&lt;\/b&gt;/g, '</b>');
	};

	var showDialog = function(message,options){
		if(typeof options != "object"){
			options = {};
		}
		message = (typeof message === "string") ? message : "undefined";
		options = (typeof options === "object") ? options : {};
		var divContent = (options.error === true) ? ("<pre>" + message + "</pre>") : ("<p>" + message + "</p>");
		var dialogTitle = (typeof options.title === "string") ? options.title : "Notificación";
		$('<div></div>').html(divContent).dialog({
			autoOpen: true,
			dialogClass:'notificationDialog',
			title: dialogTitle,
			closeOnEscape: true,
			resizable: false,
			draggable: false,
			modal: true,
			open: function(event, ui) {
				var theDialog = this;
				//Close dialog when click outside
				$('.ui-widget-overlay').bind('click', function(){ 
					$(theDialog).dialog('close');
				});
			}
		});
	};

	var showDialogWithErrors = function(message,errors){
		errors.unshift(message + ":\n");
		var errorMessage = errors.join("\n-> ");
		C.Utils.showDialog(errorMessage,{error:true});
	};

	var closePanels = function(){
		//Close all panels
		$(".cpanel").hide();
		//Make icons inactive
		$(".cpanelicon").removeClass("active");
	};

	var readURLparams = function(){
		var params = {};
		try {
			var location = window.location;
			if(typeof location === "undefined"){
				return params;
			}
			var URLparams = location.search;
			URLparams = URLparams.substr(1,URLparams.length-1);
			var URLparamsArray = URLparams.split("&");
			for(var i=0; i<URLparamsArray.length; i++){
				try {
					var paramData = URLparamsArray[i].split("=");
					if(typeof paramData[1] === "string"){
						params[paramData[0]] = paramData[1];
					}
				} catch(e){}
			}
		} catch (e) {}

		return params;
	};

	var buildURLwithParams = function(URLparams){
		var url = (C.CORE.isViewerMode() ? "index.html" : "edit.html");
		var index = 0;

		if(typeof URLparams === "object"){
			for(var key in URLparams){
				if(index===0){
					url += "?";
				} else {
					url += "&";
				}
				index++;
				url += (key + "=" + URLparams[key])
			}
		}

		return url;
	};


	/* Features and support */

	var isHistorySupported = function(){
		return ((typeof history === "object")&&(typeof history.pushState === "function"));
	};

	var isFileSaverSupported = function(){
		return _fileSaverSupported;
	};

	var isFileReaderSupported = function(){
		return _isFileReaderSupported;
	};

	var isLocalStorageSupported = function(){
		return _localStorageSupported;
	};

	var _checkFileSaverSupport = function(){
		try {
			_fileSaverSupported = !!new Blob;
		} catch (e) {}
	};

	var _checkFileReaderSupport = function(){
		//FileReader API support (doc at https://developer.mozilla.org/en-US/docs/Web/API/FileReader)
		_isFileReaderSupported = false;
		try {
			if(window.File && window.FileReader && window.FileList && window.Blob){
				_isFileReaderSupported = true;
			}
		} catch (e) {}
	};

	var _checkLocalStorageSupport = function(){
		if((typeof(Storage)!=="undefined")){
			//Check if there is no security restrictions
			try {
				localStorage.setItem("myKey","myKeyValue");
				localStorage.getItem("myKey");
				localStorage.removeItem("myKey");
				_localStorageSupported = true;
				return;
			} catch(e){}
		}
		_localStorageSupported = false;
	};

	var clearLocalStorage = function(){
		if(isLocalStorageSupported()){
			localStorage.clear();
		}
	};

	var getReadableDate = function(date){
		var readableDate = "";
		if(typeof date == "string"){
			date = new Date(date);
		}
		if((date instanceof Date)&&(!isNaN(date.getDate()))){
			readableDate = date.getDate() + "/" + (date.getMonth()+1) + "/" + date.getFullYear();
		}
		return readableDate;
	};

	return {
		init 					: init,
		moveElementInArray		: moveElementInArray,
		isCodeEmpty				: isCodeEmpty,
		purgeTextString			: purgeTextString,
		showDialog				: showDialog,
		showDialogWithErrors	: showDialogWithErrors,
		closePanels				: closePanels,
		isHistorySupported		: isHistorySupported,
		isFileSaverSupported	: isFileSaverSupported,
		isFileReaderSupported 	: isFileReaderSupported,
		isLocalStorageSupported	: isLocalStorageSupported,
		clearLocalStorage		: clearLocalStorage,
		readURLparams			: readURLparams,
		buildURLwithParams		: buildURLwithParams,
		getReadableDate			: getReadableDate,
		getAgesFromAgeRange		: getAgesFromAgeRange
	};

}) (CODEditor,jQuery);