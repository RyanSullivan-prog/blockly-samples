/**
 * @license
 * Copyright 2016 Google LLC
 * https://github.com/google/blockly-games
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Music pitch input field. Borrowed from Blockly Games.
 * @author fraser@google.com (Neil Fraser)
 * @author samelh@google.com (Sam El-Husseini)
 */
'use strict';

goog.provide('CustomFields.FieldPitch');

goog.require('Blockly.FieldTextInput');
goog.require('Blockly.utils.math');
goog.require('Blockly.utils.object');

var CustomFields = CustomFields || {};

/**
 * Class for an editable pitch field.
 * @param {string} text The initial content of the field.
 * @extends {Blockly.FieldTextInput}
 * @constructor
 */
class FieldPitch extends Blockly.FieldTextInput {
  /**
   * All notes available for the picker.
   */
  static NOTES = 'C3 D3 E3 F3 G3 A3 B3 C4 D4 E4 F4 G4 A4'.split(/ /);

  constructor(text) {
    super(text);

    // Disable spellcheck.
    this.setSpellcheck(false);

    /**
     * Click event data.
     * @type {?Blockly.browserEvents.Data}
     * @private
     */
    this.clickWrapper_ = null;

    /**
     * Move event data.
     * @type {?Blockly.browserEvents.Data}
     * @private
     */
    this.moveWrapper_ = null;
  }
  
  /**
   * Construct a FieldPitch from a JSON arg object.
   * @param {!Object} options A JSON object with options (pitch).
   * @return {!FieldPitch} The new field instance.
   * @package
   * @nocollapse
   */
  static fromJson(options) {
    return new FieldPitch(options['pitch']);
  }

  /**
   * Show the inline free-text editor on top of the text and the note picker.
   * @protected
   */
  showEditor_() {
    super.showEditor_();

    const div = Blockly.WidgetDiv.DIV;
    if (!div.firstChild) {
      // Mobile interface uses Blockly.dialog.setPrompt().
      return;
    }
    // Build the DOM.
    const editor = this.dropdownCreate_();
    Blockly.DropDownDiv.getContentDiv().appendChild(editor);

    Blockly.DropDownDiv.setColour(this.sourceBlock_.style.colourPrimary,
      this.sourceBlock_.style.colourTertiary);

    Blockly.DropDownDiv.showPositionedByField(
      this, this.dropdownDispose_.bind(this));

    // The note picker is different from other fields in that it updates on
    // mousemove even if it's not in the middle of a drag.  In future we may
    // change this behaviour.  For now, using bindEvent_ instead of
    // bindEventWithChecks_ allows it to work without a mousedown/touchstart.
    this.clickWrapper_ =
      Blockly.browserEvents.bind(this.imageElement_, 'click', this,
        this.hide_);
    this.moveWrapper_ =
      Blockly.browserEvents.bind(this.imageElement_, 'mousemove', this,
        this.onMouseMove);

    this.updateGraph_();
  }

  /**
   * Create the pitch editor.
   * @return {!Element} The newly created pitch picker.
   * @private
   */
  dropdownCreate_() {
    this.imageElement_ = document.createElement('div');
    this.imageElement_.id = 'notePicker';

    return this.imageElement_;
  }

  /**
   * Dispose of events belonging to the pitch editor.
   * @private
   */
  dropdownDispose_() {
    if (this.clickWrapper_) {
      Blockly.browserEvents.unbind(this.clickWrapper_);
      this.clickWrapper_ = null;
    }
    if (this.moveWrapper_) {
      Blockly.browserEvents.unbind(this.moveWrapper_);
      this.moveWrapper_ = null;
    }
    this.imageElement_ = null;
  }

  /**
   * Hide the editor.
   * @private
   */
  hide_() {
    Blockly.WidgetDiv.hide();
    Blockly.DropDownDiv.hideWithoutAnimation();
  }

  /**
   * Set the note to match the mouse's position.
   * @param {!Event} e Mouse move event.
   */
  onMouseMove(e) {
    const bBox = this.imageElement_.getBoundingClientRect();
    const dy = e.clientY - bBox.top;
    const note = Blockly.utils.math.clamp(Math.round(13.5 - dy / 7.5), 0, 12);
    this.imageElement_.style.backgroundPosition = (-note * 37) + 'px 0';
    this.setEditorValue_(note);
  }

  /**
   * Convert the machine-readable value (0-12) to human-readable text (C3-A4).
   * @param {number|string} value The provided value.
   * @return {string|undefined} The respective note, or undefined if invalid.
   */
  valueToNote(value) {
    return FieldPitch.NOTES[Number(value)];
  }

  /**
   * Convert the human-readable text (C3-A4) to machine-readable value (0-12).
   * @param {string} text The provided note.
   * @return {number|undefined} The respective value, or undefined if invalid.
   */
  noteToValue(text) {
    const normalizedText = text.trim().toUpperCase();
    const i = FieldPitch.NOTES.indexOf(normalizedText);
    return i > -1 ? i : undefined;
  }

  /**
   * Get the text to be displayed on the field node.
   * @return {?string} The HTML value if we're editing, otherwise null. Null means
   *   the super class will handle it, likely a string cast of value.
   * @protected
   */
  getText_() {
    if (this.isBeingEdited_) {
      return super.getText_();
    }
    return this.valueToNote(this.getValue()) || null;
  }

  /**
   * Transform the provided value into a text to show in the HTML input.
   * @param {*} value The value stored in this field.
   * @return {string} The text to show on the HTML input.
   */
  getEditorText_(value) {
    return this.valueToNote(value);
  }

  /**
   * Transform the text received from the HTML input (note) into a value
   * to store in this field.
   * @param {string} text Text received from the HTML input.
   * @return {*} The value to store.
   */
  getValueFromEditorText_(text) {
    return this.noteToValue(text);
  }

  /**
   * Updates the graph when the field rerenders.
   * @private
   * @override
   */
  render_() {
    super.render_();
    this.updateGraph_();
  }

  /**
   * Redraw the note picker with the current note.
   * @private
   */
  updateGraph_() {
    if (!this.imageElement_) {
      return;
    }
    const i = this.getValue();
    this.imageElement_.style.backgroundPosition = (-i * 37) + 'px 0';
  }

  /**
   * Ensure that only a valid value may be entered.
   * @param {*} opt_newValue The input value.
   * @return {*} A valid value, or null if invalid.
   */
  doClassValidation_(opt_newValue) {
    if (opt_newValue === null || opt_newValue === undefined) {
      return null;
    }
    const note = this.valueToNote(opt_newValue);
    if (note) {
      return opt_newValue;
    }
    return null;
  }
}

Blockly.fieldRegistry.register('field_pitch', FieldPitch);

CustomFields.FieldPitch = FieldPitch;