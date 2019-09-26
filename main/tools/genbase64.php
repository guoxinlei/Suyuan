<?php
$d = dir("../images/original");
$components = [];
$imports = [];
while ($entry = $d->read()) {
    if ($entry == "." || $entry == "..")
        continue;

    echo $entry."\n";

    if (!preg_match("/^(.*)\.(jpg|png)$/is", $entry, $matched))
        continue;

    unset($list);

    $file = $matched[1];
    $contents = @file_get_contents("../images/original/".$entry);
    if (!$contents)
        continue;

    $contents = base64_encode($contents);

    $list["image"] = "data:image/png;base64,".$contents;

    @file_put_contents("../images/".$file.".js", "export default ".json_encode($list).";");

    $components[] = getName($file).",\n";
    $imports[] = "import ".getName($file)." from './".$file."';";

}

// write index.js
$content = implode("\n", $imports);
$content .= "\n\n";
$content .= "export {\n\t".implode("\t", $components).'}';
file_put_contents("../images/index.js", $content);

/**
 * get component name by string
 * example: index-background => IndexBackground
 */
function getName($string) {
    $info = explode("-", $string);
    $name = '';
    foreach ($info as $s) {
        $s[0] = strtoupper($s[0]);
        $name .= $s;
    }

    return $name;
}

?>
