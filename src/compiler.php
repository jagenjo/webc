<?php

	//Javi Agenjo (@tamat) April 2014
	error_reporting(E_ALL);
	header('Content-Type: application/json');

	//command to execute
	$compiler_cmd = "emcc -s INVOKE_RUN=0 --pre-js pre-js.js --post-js post-js.js ";

	//get code to compile
	if(!isset( $_REQUEST["code"] ))
		die("{\"error\":\"no code found\"}");

	//set the compiler line
	$code = $_REQUEST["code"];
	$options = Array("optimize"=>false);
	if(isset($_REQUEST["options"]))
		$options = $_REQUEST["options"];
	if( isset( $options["optimize"] ) && $options["optimize"] == "true" )
		$compiler_cmd .= " -o2 ";

	//generate hash of code + compiler settings
	$md5 = md5($compiler_cmd . $code);

	//generate filenames
	//$tempfilename = tempnam("/var/tmp", "EMCC_CODE");
	$tempfilename = "./tmp/" . $md5 . ".cpp";
	$tempoutput = "./tmp/" . $md5 . ".js";

	//response output
	$result = Array();

	if( file_exists( $tempoutput ) )
	{
		//reuse cached
		$output = "CACHED";
	}
	else
	{
		//store file in HD, then compile using emcc to another file
		file_put_contents ( $tempfilename, $code );
		$cmd = $compiler_cmd . " " . $tempfilename ." -o " . $tempoutput . " 2>&1";
		$str = exec($cmd, $out);
		$output = join($out,"\n");

		//if no compiled code found, then error during compilation
		if( !file_exists( $tempoutput ) )
			die( json_encode(Array("error"=>"cannot compile","output"=>$output,"cmd"=>$cmd)) );
	}

	$result["command"] = $compiler_cmd;
	$result["filename"] = $tempfilename;
	$result["output"] = $output;
	$result["emcc_url"] = $tempoutput;

	//this allow to return the code in the request
	if(isset($_REQUEST["getcode"]))
		$result["emcc_js"] = file_get_contents( $result["emcc_url"] );

	//return result
	echo json_encode($result);
?>