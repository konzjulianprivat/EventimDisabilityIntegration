// components/DeleteAccountModal.jsx
"use client";
import React from "react";

export default function DeleteAccountModal({
                                               visible,
                                               onCancel,
                                               onConfirm,
                                               inputValue,
                                               setInputValue,
                                           }) {
    if (!visible) return null;

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <h3>Account löschen</h3>
                <p>Bitte geben Sie <strong>“Löschen”</strong> ein, um Ihr Konto endgültig zu löschen:</p>
                <input
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    className="input-field"
                    placeholder="Löschen"
                />
                <div className="modal-actions" style={{ marginTop: "1rem" }}>
                    <button
                        className="profile__btn-cancel"
                        onClick={onConfirm}
                        disabled={inputValue !== "Löschen"}
                    >
                        Bestätigen
                    </button>
                    <button
                        className="profile__btn-cancel"
                        style={{ backgroundColor: "#ccc", color: "#333", marginLeft: "0.5rem" }}
                        onClick={onCancel}
                    >
                        Abbrechen
                    </button>
                </div>
            </div>
        </div>
    );
}