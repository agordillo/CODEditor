/* 
 * Enable FullScreen for CODEditor
 */

CODEditor.FullScreen = (function(C,$,undefined){

	//Internals
	var _canFullScreen;

	var init = function(){
		_addContainerFSAttributes();
		_canFullScreen = ((_isFullScreenSupported())&&(_getFsEnabled(_getFSDocumentTarget()))&&(!C.Environment.isPreview())&&(!_isFullScreenExplicitlyDisabled()));
		if(_canFullScreen){
			_updateFsButtons();
			_enableFullScreen();
		}
	};

	var canFullScreen = function(){
		return _canFullScreen;
	};

	var _getFSDocumentTarget = function(){
		return (C.Environment.getContainerType()=="OBJECT" ? window.parent.document : document);
	};

	var _getFSElementTarget = function(){
		return (C.Environment.getContainerType()=="OBJECT" ? C.Environment.getContainer().parentElement : document.documentElement);
	};

	var _updateFsButtons = function(){
		if(!_canFullScreen){
			return $("#fullscreen_button").css("display","none");
		}
		$("#fullscreen_button").css("display","inline-block");

		if(isFullScreen()){
			//Fullscreen on
			$("#fullscreen_img").removeClass("fsoff").addClass("fson");
			$("#fullscreen_img").attr("src","img/fullscreen_off.png");
		} else {
			//Fullscreen off
			$("#fullscreen_img").removeClass("fson").addClass("fsoff");
			$("#fullscreen_img").attr("src","img/fullscreen_on.png");
		}
	};

	var _enableFullScreen = function(){
		$(document).on('click', '#fullscreen_img', _toggleFullScreen);
		$(document).on("webkitfullscreenchange mozfullscreenchange fullscreenchange MSFullscreenChange",function(event){
			//Give some time...
			setTimeout(function(){
				_updateFsButtons();
				C.UI.adjustView();
			}, 400);
		});
	};

	var _toggleFullScreen = function (){
		var myDoc = _getFSDocumentTarget();
		var myElem = _getFSElementTarget();
		
		if(isFullScreen()){
			_cancelFullscreen(myDoc);
		} else {
			_launchFullscreenForElement(myDoc,myElem);
		}
	};

	/*
	 * Wrapper for HTML5 FullScreen API. Make it cross-browser
	 */

	var isFullScreen = function(){
		var myDoc = _getFSDocumentTarget();
		if(typeof myDoc.mozFullScreen == "boolean"){
			return myDoc.mozFullScreen;
		} else if(typeof myDoc.webkitIsFullScreen == "boolean"){
			return myDoc.webkitIsFullScreen;
		} else {
			var fsElement = _getFsElement(myDoc);
			return ((typeof fsElement != "undefined")&&(fsElement!=null));
		}
	};

	var _getFsElement = function(myDoc){
		return myDoc.fullscreenElement || myDoc.mozFullScreenElement || myDoc.webkitFullscreenElement || myDoc.msFullscreenElement;
	};

	var _getFsEnabled = function(myDoc){
		return myDoc.fullscreenEnabled || myDoc.mozFullScreenEnabled || myDoc.webkitFullscreenEnabled || myDoc.msFullscreenEnabled;
	};

	var _launchFullscreenForElement = function(myDoc,element){
		if(element.requestFullscreen) {
			element.requestFullscreen();
		} else if(element.mozRequestFullScreen) {
			element.mozRequestFullScreen();
		} else if(element.webkitRequestFullscreen) {
			element.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
			setTimeout(function(){
				if (!myDoc.webkitCurrentFullScreenElement){
					// Element.ALLOW_KEYBOARD_INPUT does not work, document is not in full screen mode
					//Fix known Safari bug
					element.webkitRequestFullScreen();
				}
			},250);
		} else if(element.msRequestFullscreen) {
			element.msRequestFullscreen();
		}
	};

	var _cancelFullscreen = function(myDoc) {
		if(myDoc.exitFullscreen) {
			myDoc.exitFullscreen();
		} else if(myDoc.cancelFullScreen) {
			myDoc.cancelFullScreen();
		} else if(myDoc.mozCancelFullScreen) {
			myDoc.mozCancelFullScreen();
		} else if(myDoc.webkitExitFullscreen) {
			myDoc.webkitExitFullscreen();
		} else if (myDoc.webkitCancelFullScreen) {
			myDoc.webkitCancelFullScreen();
		} else if(myDoc.msExitFullscreen) {
			myDoc.msExitFullscreen();
		}
	};

	/* Check full screen support */
	var _isFullScreenSupported = function(){
		var elem = document.createElement('div');
		if(elem && (elem.requestFullScreen || elem.mozRequestFullScreen || elem.webkitRequestFullScreen || elem.msRequestFullscreen)){
			return true;
		} else {
			return false;
		}
	};

	var _isFullScreenExplicitlyDisabled = function(){
		var urlParams = C.CORE.getURLParams();
		if(typeof urlParams == "object"){
			return urlParams["fs"] === "false";
		}
		return false;
	};

	/* Add container attributes for enable FS when possible */
	var _addContainerFSAttributes = function(){
		try {
			var container = C.Environment.getContainer();
			if(typeof container != "undefined"){
				//CODEditor is embed, but not in external domain
				if(typeof $(container).attr("allowfullscreen") == "undefined"){
					$(container).attr("allowfullscreen","true");
					$(container).attr("webkitAllowFullScreen","true");
					$(container).attr("mozallowfullscreen","true");
				}

				var fsElementTarget = _getFSElementTarget();
				if(fsElementTarget != document.documentElement){
					//Add FS style
					$(container).addClass("CODEditorFS");
					$(fsElementTarget).addClass("CODEditorFS");
					$(window.parent.document).find("head").append("<style>.CODEditorFS:full-screen, :full-screen > object.CODEditorFS {width: 100% !important;height: 100% !important;}</style>");
					$(window.parent.document).find("head").append("<style>.CODEditorFS:-webkit-full-screen, :-webkit-full-screen > object.CODEditorFS {width: 100% !important;height: 100% !important;}</style>");
					$(window.parent.document).find("head").append("<style>.CODEditorFS:-moz-full-screen, :-moz-full-screen > object.CODEditorFS {width: 100% !important;height: 100% !important;}</style>");
				}
			}
		} catch(e){}
	};

	return {
		init						: init,
		canFullScreen 				: canFullScreen,
		isFullScreen 				: isFullScreen
	};
    
}) (CODEditor,jQuery);