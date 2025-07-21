// components/DeleteAccountModal.jsx
"use client";
import React from "react";

export default function DeleteAccountModal({
                                               visible,
                                               onCancel,
                                               onConfirm,
                                               inputValue,
                                               setInputValue,
                                               myEvents,
                                               deleteError = ''
                                           }) {
    if (!visible) return null;
    if (myEvents.length > 0) deleteError = "Sie können Ihr Konto nicht löschen, da sie Tickets für Veranstaltungen haben, die noch nicht stattgefunden haben.";

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <h2>Account löschen</h2>
                <br/>
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
                        style={{ backgroundColor: deleteError == '' ? 'red' : '#ccc' }}
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
                {deleteError && (
                    <div className="error-message" style={{ color: 'red', marginTop: '1rem' }}>
                        {deleteError}
                    </div>
                )}
            </div>
        </div>
    );
}