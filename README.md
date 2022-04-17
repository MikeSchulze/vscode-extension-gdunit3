
### GdUnit3 a Godot Unit Test Inspector for Visual Studio Code

This extension provides an inspector to run and debug your GdUnit3 c# tests in VS Code. 
![Screenshot](resources/vsc-extension.png)

## Release Notes

### 1.0.0 - Beta

Initial release of GdUnit3 vscode extension

-----------------------------------------------------------------------------------------------------------
## Getting started

* [Install the extension](https://mikeschulze.github.io/gdUnit3/first_steps/install/#install-visual-studio-gdunit3-extension)
* [Configure GdUnit3](https://mikeschulze.github.io/gdUnit3/first_steps/install/#gdunit3-extension-settings) to discover your tests


## Features
* Embedded test inspector to navigate over your tests
* Run or debug c# tests from the inspector
* Run or debug tests over a context menu on FileNavigator, C# editor
* Failure reporting over inspector report view
* Jump by double click to reported test failure

## Configuration
List of currently used properties:

Property                                       | Description
-----------------------------------------------|---------------------------------------------------------------
`gdunit3.godotExecutable`                      | The path to the Godot executable. Both relative and absolute paths are accepted.
`gdunit3.server.port`                          | The GdUnit server port to comunicate with the test runner client.
`gdunit3.debuger.port`                         | The c# debuger port (23685)


## Requirements
* C#
* VS Code Mono Debug
* Installed Godot-Mono 3.3.x 

## Known Issues

The extension is current in beta version and is not featue complete.

### You are welcome to:
  * [Give Feedback](https://github.com/MikeSchulze/gdUnit3/discussions/228)
  * [Suggest Improvements](https://github.com/MikeSchulze/vscode-extension-gdunit3/issues/new?assignees=MikeSchulze&labels=enhancement&template=feature_request.md&title=)
  * [Report Bugs](https://github.com/MikeSchulze/vscode-extension-gdunit3/issues/new?assignees=MikeSchulze&labels=bug&template=bug_report.md&title=)
