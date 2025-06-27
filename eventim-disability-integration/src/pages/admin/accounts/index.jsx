import React from "react";

export default function UserOverview() {

    return (
        <div className="profile-container" style={{flexDirection: "column"}}>
            <div className="content-inner" style={{paddingTop: '24px'}}>
                <div className="white-box events-white-box">
                    <div className="content-inner">
                        <div className="events-header">
                            <h1>Admin-Accounts</h1>
                            <span className="arrow">›</span>
                        </div>
                        <p className="subtitle">Übersicht aller Accounts mit Adminrechten</p>
                        <div className="content-inner">
                        </div>
                    </div>
                </div>
            </div>
            <div className="content-inner" style={{paddingTop: '24px'}}>
                <div className="white-box events-white-box">
                    <div className="content-inner">
                        <div className="events-header">
                            <h1>Service-Accounts</h1>
                            <span className="arrow">›</span>
                        </div>
                        <p className="subtitle">Übersicht aller Accounts des Eventim-Service</p>
                        <div className="content-inner">
                        </div>
                    </div>
                </div>
            </div>
            <div className="content-inner" style={{paddingTop: '24px'}}>
                <div className="white-box events-white-box">
                    <div className="content-inner">
                        <div className="events-header">
                            <h1>User-Accounts</h1>
                            <span className="arrow">›</span>
                        </div>
                        <p className="subtitle">Übersicht aller Nutzerkonten</p>
                        <div className="content-inner">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}