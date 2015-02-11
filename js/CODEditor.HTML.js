CODEditor.HTML = (function(C,$,undefined){

	var init = function(options){
	};

	var runHTMLcode = function(HTMLcode){
		var iframe = $("<iframe class='iframe_code'></iframe>");
	    $("#preview").append(iframe);

	    doc = $("#preview").find("iframe").contents()[0];
	           
	    doc.open();
	    doc.writeln(HTMLcode);
	    doc.close();
	};

	return {
		init 		: init,
		runHTMLcode	: runHTMLcode
	};

}) (CODEditor,jQuery);