CODEditor.HTML = (function(C,$,undefined){

	var init = function(options){
	};

	var runHTMLcode = function(HTMLcode){
		var iframe = $("<iframe class='iframe_code'></iframe>");
		$("#preview").append(iframe);
		
		var doc = $("#preview").find("iframe").contents()[0];
		doc.open();
		doc.writeln(HTMLcode);
		doc.close();

		//Check if an excercise is currently tried
		var currentExercise = CODEditor.CORE.getCurrentExercise();

		if(typeof currentExercise !== "undefined"){
			if(typeof currentExercise.parsed_score_function == "function"){
				var score = CODEditor.Score.getScoreFromScoreFunction(currentExercise.parsed_score_function,doc,{});
				if(typeof score == "object"){
					//Adjust UI when exercise. Show a new window with evaluation results.
					$(iframe).addClass("onexercise");
					
					var htmlResultWrapper = $("<div class='html_result_wrapper'></div>");
					var htmlResultHeader = $("<div class='html_result_header'></div>");
					$(htmlResultHeader).html("<p>Corrección</p><span id='closeHTMLconsole'>x</span>");
					var htmlResultContent = $("<pre class='html_resultContent'></pre>");
					$(htmlResultWrapper).append(htmlResultHeader);
					$(htmlResultWrapper).append(htmlResultContent);
					$("#preview").append(htmlResultWrapper);

					_loadEvents();

					adjustHTMLPreviewUI();

					CODEditor.Score.displayScore(score,htmlResultWrapper);
				}
			}		
		}
	};

	var adjustHTMLPreviewUI = function(htmlConsole){
		htmlConsole = !(htmlConsole===false);

		var iframe = $("#preview").find("iframe");
		var htmlResultWrapper = $("#preview div.html_result_wrapper");

		if(htmlConsole){
			$(htmlResultWrapper).show();
			$(iframe).addClass("onexercise");
			var previewHeight = $("#preview").height()-3;
			var iframeHeight = Math.ceil(previewHeight*0.33);
			var resultWrapperHeight = Math.floor(previewHeight - iframeHeight - $(iframe).cssNumber("padding-top") - $(iframe).cssNumber("padding-bottom") - $(iframe).cssNumber("margin-top") - $(iframe).cssNumber("margin-bottom") - $(htmlResultWrapper).cssNumber("padding-top") - $(htmlResultWrapper).cssNumber("padding-bottom") - $(htmlResultWrapper).cssNumber("margin-top") - $(htmlResultWrapper).cssNumber("margin-bottom"));
			$(iframe).height(iframeHeight);
			$(htmlResultWrapper).height(resultWrapperHeight);
		} else {
			$(iframe).removeClass("onexercise");
			$(iframe).css("height","99%");
			$(htmlResultWrapper).hide();
		}
	};

	var _loadEvents = function(){
		$("#closeHTMLconsole").click(function(){
			adjustHTMLPreviewUI(false);
		});
	};

	return {
		init 					: init,
		runHTMLcode				: runHTMLcode,
		adjustHTMLPreviewUI 	: adjustHTMLPreviewUI
	};

}) (CODEditor,jQuery);