/* 
 * Enable FullScreen for CODEditor
 */

CODEditor.FullScreen = (function(C,$,undefined){

	//Internals
	var _canFullScreen;

	var init = function(){
		_canFullScreen = ((_isFullScreenSupported())&&(_getFsEnabled(document)));
		if(_canFullScreen){
			_updateFsButtons();
			_enableFullScreen();
		}
	};

	var canFullScreen = function(){
		return _canFullScreen;
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
		var myDoc = document;
		var myElem = document.documentElement;
		
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
		var myDoc = document;
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

	return {
		init						: init,
		canFullScreen 				: canFullScreen,
		isFullScreen 				: isFullScreen
	};
    
}) (CODEditor,jQuery);