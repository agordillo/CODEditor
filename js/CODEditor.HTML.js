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
					
					var htmlResultWrapper = $("<div class='html_result_wrapper'></div>");
					var htmlResultHeader = $("<div class='html_result_header'></div>");
					$(htmlResultHeader).html("<p>Corrección</p><div id='consoleButtons'><img id='closeHTMLconsole' title='Cerrar consola' src='img/close_console.png'/><img id='minimizeHTMLconsole' title='Minimizar consola' src='img/minimize_console.png'/><img id='maximizeHTMLconsole' title='Maximizar consola' src='img/maximize_console.png'/></div>");
					var htmlResultContent = $("<div class='html_resultContent'></div>");
					$(htmlResultWrapper).append(htmlResultHeader);
					$(htmlResultWrapper).append(htmlResultContent);
					$("#preview").append(htmlResultWrapper);

					_loadEvents();

					adjustHTMLPreviewUI();

					CODEditor.Score.displayScore(score,htmlResultContent);

					if(score.score >= 5){
						CODEditor.CORE.onPassCurrentExercise();
					}
				}
			}		
		}
	};

	var adjustHTMLPreviewUI = function(showHTMLconsole,showHTMLconsoleStatus){
		var HTMLconsoleDOM = $("#preview div.html_result_wrapper");

		if(typeof showHTMLconsole !== "boolean"){
			showHTMLconsole = $(HTMLconsoleDOM).is(":visible");
		}

		if((typeof showHTMLconsoleStatus !== "string")&&(showHTMLconsole)){
			if($(HTMLconsoleDOM).hasClass("MINIMIZED")){
				showHTMLconsoleStatus = "MINIMIZED";
			} else if($(HTMLconsoleDOM).hasClass("MAXIMIZED")){
				showHTMLconsoleStatus = "MAXIMIZED";
			}
		}
		

		var iframe = $("#preview").find("iframe");
		var htmlResultHeader = $("#preview div.html_result_header");
		var htmlResultContent = $("#preview div.html_resultContent");

		if(showHTMLconsole){
			$(HTMLconsoleDOM).show();
			$(iframe).addClass("withHTMLconsole");

			var previewHeight = $("#preview").height()-3;
			var iframeHeight;
			var HTMLconsoleHeight;
			var HTMLheaderHeight = $(htmlResultHeader).outerHeight();
			var iframeAndHTMLconsoleExtraSpace = $(iframe).cssNumber("padding-top") + $(iframe).cssNumber("padding-bottom") + $(iframe).cssNumber("margin-top") + $(iframe).cssNumber("margin-bottom") + $(HTMLconsoleDOM).cssNumber("padding-top") + $(HTMLconsoleDOM).cssNumber("padding-bottom") + $(HTMLconsoleDOM).cssNumber("margin-top") + $(HTMLconsoleDOM).cssNumber("margin-bottom");

			if(showHTMLconsoleStatus==="MINIMIZED"){
				$(HTMLconsoleDOM).addClass("MINIMIZED").removeClass("MAXIMIZED");
				$(htmlResultContent).hide();
				HTMLconsoleHeight = $(htmlResultHeader).outerHeight();
				iframeHeight = Math.floor(previewHeight - HTMLconsoleHeight - iframeAndHTMLconsoleExtraSpace);
			} else if(showHTMLconsoleStatus==="MAXIMIZED"){
				$(HTMLconsoleDOM).addClass("MAXIMIZED").removeClass("MINIMIZED");
				$(htmlResultContent).show();
				iframeHeight = 0;
				HTMLconsoleHeight = previewHeight;
			} else {
				$(HTMLconsoleDOM).removeClass("MINIMIZED").removeClass("MAXIMIZED");
				$(htmlResultContent).show();
				iframeHeight = Math.ceil(previewHeight*0.33);
				HTMLconsoleHeight = Math.floor(previewHeight - iframeHeight - iframeAndHTMLconsoleExtraSpace);
			}

			$(iframe).height(iframeHeight);
			if(iframeHeight === 0){
				$(iframe).hide();
			} else if(!$(iframe).is(":visible")){
				$(iframe).show();
			}
			$(HTMLconsoleDOM).height(HTMLconsoleHeight);
			$(htmlResultContent).height(HTMLconsoleHeight-HTMLheaderHeight);

		} else {
			$(HTMLconsoleDOM).removeClass("MINIMIZED").removeClass("MAXIMIZED");
			$(HTMLconsoleDOM).hide();
			$(iframe).removeClass("withHTMLconsole");
			$(iframe).css("height","99%");
		}
	};

	var _loadEvents = function(){
		$("#closeHTMLconsole").click(function(){
			adjustHTMLPreviewUI(false);
		});

		$("#minimizeHTMLconsole").click(function(){
			var HTMLconsoleDOM = $("#preview div.html_result_wrapper");
			var showHTMLconsoleStatus = undefined;

			if($(HTMLconsoleDOM).hasClass("MINIMIZED")){
				showHTMLconsoleStatus = "NORMAL";
			} else if($(HTMLconsoleDOM).hasClass("MAXIMIZED")){
				showHTMLconsoleStatus = "MINIMIZED";
			} else {
				showHTMLconsoleStatus = "MINIMIZED";
			}

			adjustHTMLPreviewUI(true,showHTMLconsoleStatus);
		});

		$("#maximizeHTMLconsole").click(function(){
			var HTMLconsoleDOM = $("#preview div.html_result_wrapper");
			var showHTMLconsoleStatus = undefined;

			if($(HTMLconsoleDOM).hasClass("MINIMIZED")){
				showHTMLconsoleStatus = "MAXIMIZED";
			} else if($(HTMLconsoleDOM).hasClass("MAXIMIZED")){
				showHTMLconsoleStatus = "NORMAL";
			} else {
				showHTMLconsoleStatus = "MAXIMIZED";
			}

			adjustHTMLPreviewUI(true,showHTMLconsoleStatus);
		});
	};

	return {
		init 					: init,
		runHTMLcode				: runHTMLcode,
		adjustHTMLPreviewUI 	: adjustHTMLPreviewUI
	};

}) (CODEditor,jQuery);