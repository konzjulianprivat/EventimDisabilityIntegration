-- SQL script to setup area and event tables
CREATE TABLE IF NOT EXISTS areas (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS venue_areas (
    id UUID PRIMARY KEY,
    venue_id UUID REFERENCES venues(id),
    area_id UUID REFERENCES areas(id),
    max_capacity INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS event_categories (
    id UUID PRIMARY KEY,
    event_id UUID REFERENCES events(id),
    name TEXT,
    price NUMERIC(10,2)
);

CREATE TABLE IF NOT EXISTS event_venue_areas (
    id UUID PRIMARY KEY,
    event_id UUID REFERENCES events(id),
    venue_area_id UUID REFERENCES venue_areas(id),
    capacity INTEGER NOT NULL,
    category_id UUID REFERENCES event_categories(id)
);
