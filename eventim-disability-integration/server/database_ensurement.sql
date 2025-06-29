-- Ensure database integrity by adding unique constraints and triggers

-- Prevent duplicate user emails
ALTER TABLE users
    ADD CONSTRAINT unique_user_email UNIQUE (email);

-- Prevent duplicate city names within a country
ALTER TABLE cities
    ADD CONSTRAINT unique_city_name_per_country UNIQUE (country_id, name);

-- Ensure artists have unique names
ALTER TABLE artists
    ADD CONSTRAINT unique_artist_name UNIQUE (name);

-- Unique title and dates for tours
ALTER TABLE tours
    ADD CONSTRAINT unique_tour_title_dates UNIQUE (title, start_date, end_date);

-- Unique start time per venue
ALTER TABLE events
    ADD CONSTRAINT unique_event_start_per_venue UNIQUE (venue_id, start_time);

-- Unique genre names
ALTER TABLE genres
    ADD CONSTRAINT unique_genre_name UNIQUE (name);

-- Unique payment option labels
ALTER TABLE payment_options
    ADD CONSTRAINT unique_payment_option_label UNIQUE (label);

-- Restrict deletion of last user per role
CREATE OR REPLACE FUNCTION prevent_last_user_role_delete()
RETURNS trigger AS $$
BEGIN
    IF (SELECT COUNT(*) FROM users WHERE role = OLD.role AND user_id <> OLD.user_id) = 0 THEN
        RAISE EXCEPTION 'Cannot delete the last user with this role';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_last_user_role_delete ON users;
CREATE TRIGGER trg_prevent_last_user_role_delete
BEFORE DELETE ON users
FOR EACH ROW
EXECUTE PROCEDURE prevent_last_user_role_delete();

-- Restrict tour deletion when tickets exist
CREATE OR REPLACE FUNCTION prevent_tour_delete_when_tickets()
RETURNS trigger AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM events e
        JOIN event_categories ec ON ec.event_id = e.id
        JOIN tickets t ON t.event_category_id = ec.id
        WHERE e.tour_id = OLD.id
    ) THEN
        RAISE EXCEPTION 'Cannot delete tour with existing tickets';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_tour_delete ON tours;
CREATE TRIGGER trg_prevent_tour_delete
BEFORE DELETE ON tours
FOR EACH ROW
EXECUTE PROCEDURE prevent_tour_delete_when_tickets();

-- Restrict event_category deletion when tickets exist
CREATE OR REPLACE FUNCTION prevent_event_category_delete()
RETURNS trigger AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM tickets WHERE event_category_id = OLD.id) THEN
        RAISE EXCEPTION 'Cannot delete event category with existing tickets';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_event_category_delete ON event_categories;
CREATE TRIGGER trg_prevent_event_category_delete
BEFORE DELETE ON event_categories
FOR EACH ROW
EXECUTE PROCEDURE prevent_event_category_delete();
