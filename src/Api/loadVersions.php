<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: access");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

include "db_connection.php";

$jwtArray = include "jwtArray.php";
$userId = $jwtArray['userId'];

$branchId =  mysqli_real_escape_string($conn,$_REQUEST["branchId"]);

$success = TRUE;
$message = "";

if ($branchId == ""){
    $success = FALSE;
    $message = 'Internal Error: missing branchId';
}elseif ($userId == ""){
    $success = FALSE;
    $message = "You need to be signed in to load versions";
}

if ($success){
    $sql = "
    SELECT canViewDrive
    FROM drive_user
    WHERE userId = '$userId'
    AND driveId = '$driveId'
    ";
    $result = $conn->query($sql); 
    $row = $result->fetch_assoc();
    if ($row['canViewDrive'] == '0'){
      $success = FALSE;
      $message = "You need need permission to view versions";
    }
}


if ($success){

$sql="
SELECT 
 c.contentId AS contentId,
 c.versionId AS versionId,
 c.title AS title,
 c.timestamp AS timestamp,
 c.isDraft AS isDraft,
 c.isNamed AS isNamed
FROM content AS c
WHERE removedFlag = 0
AND branchId = '$branchId'
ORDER BY isDraft DESC,c.timestamp DESC
";

$result = $conn->query($sql); 
$versions_arr = array();         
if ($result->num_rows > 0){

    while($row = $result->fetch_assoc()){ 
        $version = array(
                "title"=>$row['title'],
                "contentId"=>$row['contentId'],
                "versionId"=>$row['versionId'],
                "timestamp"=>$row['timestamp'],
                "isDraft"=>$row['isDraft'],
                "isNamed"=>$row['isNamed']
        );
        array_push($versions_arr,$version);
    }
}

}

$response_arr = array(
        "success"=>$success,
        "versions"=>$versions_arr,
        "message"=>$message

);
    
 // set response code - 200 OK
 http_response_code(200);
     

 // make it json format
 echo json_encode($response_arr);
$conn->close();


?>
           
