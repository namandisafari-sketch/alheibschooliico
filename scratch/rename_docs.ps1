
$files = Get-ChildItem -Path "c:\Users\user\Desktop\alheb-school-bloom\docs\*.docx"
$i = 1
foreach ($f in $files) {
    $newName = "c:\Users\user\Desktop\alheb-school-bloom\docs\doc_$i.docx"
    Copy-Item -Path $f.FullName -Destination $newName
    $i++
}
