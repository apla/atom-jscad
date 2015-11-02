var AtomScadPreview;

AtomScadPreview = require('../lib/atom-scad-preview');

describe("AtomScadPreview", function() {
  var activationPromise, ref, workspaceElement;
  ref = [], workspaceElement = ref[0], activationPromise = ref[1];
  beforeEach(function() {
    workspaceElement = atom.views.getView(atom.workspace);
    return activationPromise = atom.packages.activatePackage('atom-scad-preview');
  });
  return describe("when the atom-scad-preview:toggle event is triggered", function() {
    it("hides and shows the modal panel", function() {
      expect(workspaceElement.querySelector('.atom-scad-preview')).not.toExist();
      atom.commands.dispatch(workspaceElement, 'atom-scad-preview:toggle');
      waitsForPromise(function() {
        return activationPromise;
      });
      return runs(function() {
        var atomScadPreviewElement, atomScadPreviewPanel;
        expect(workspaceElement.querySelector('.atom-scad-preview')).toExist();
        atomScadPreviewElement = workspaceElement.querySelector('.atom-scad-preview');
        expect(atomScadPreviewElement).toExist();
        atomScadPreviewPanel = atom.workspace.panelForItem(atomScadPreviewElement);
        expect(atomScadPreviewPanel.isVisible()).toBe(true);
        atom.commands.dispatch(workspaceElement, 'atom-scad-preview:toggle');
        return expect(atomScadPreviewPanel.isVisible()).toBe(false);
      });
    });
    return it("hides and shows the view", function() {
      jasmine.attachToDOM(workspaceElement);
      expect(workspaceElement.querySelector('.atom-scad-preview')).not.toExist();
      atom.commands.dispatch(workspaceElement, 'atom-scad-preview:toggle');
      waitsForPromise(function() {
        return activationPromise;
      });
      return runs(function() {
        var atomScadPreviewElement;
        atomScadPreviewElement = workspaceElement.querySelector('.atom-scad-preview');
        expect(atomScadPreviewElement).toBeVisible();
        atom.commands.dispatch(workspaceElement, 'atom-scad-preview:toggle');
        return expect(atomScadPreviewElement).not.toBeVisible();
      });
    });
  });
});

// ---
// generated by coffee-script 1.9.2