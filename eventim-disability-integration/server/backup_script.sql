-- Recreated schema matching your UML model exactly

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Countries and Cities
CREATE TABLE IF NOT EXISTS countries (
                                         id        UUID PRIMARY KEY,
                                         name      VARCHAR(100) NOT NULL,
                                         iso_code  CHAR(2)
);

CREATE TABLE IF NOT EXISTS cities (
                                      id         UUID PRIMARY KEY,
                                      name       VARCHAR(100) NOT NULL,
                                      country_id UUID REFERENCES countries(id)
);

-- User roles
CREATE TABLE IF NOT EXISTS user_roles (
                                          id                             UUID PRIMARY KEY,
                                          name                           VARCHAR(50)  NOT NULL,
                                          description                    VARCHAR(100),
                                          has_editing_access             BOOLEAN      NOT NULL DEFAULT FALSE,
                                          has_creation_access            BOOLEAN      NOT NULL DEFAULT FALSE,
                                          has_role_appointing_capability BOOLEAN      NOT NULL DEFAULT FALSE,
                                          has_account_management_access  BOOLEAN      NOT NULL DEFAULT FALSE,
                                          has_disability_approval_access BOOLEAN      NOT NULL DEFAULT FALSE,
                                          has_deletion_permission        BOOLEAN      NOT NULL DEFAULT FALSE
);

-- Users
CREATE TABLE IF NOT EXISTS users (
                                     user_id                       UUID PRIMARY KEY,
                                     salutation                    VARCHAR(20),
                                     first_name                    VARCHAR(100) NOT NULL,
                                     last_name                     VARCHAR(100) NOT NULL,
                                     company                       VARCHAR(255),
                                     street_address                VARCHAR(255),
                                     postal_code                   VARCHAR(20),
                                     city                          VARCHAR(100),
                                     country                       VARCHAR(100),
                                     email                         VARCHAR(255) NOT NULL,
                                     phone                         VARCHAR(20),
                                     birth_date                    DATE,
                                     request_for_disability        BOOLEAN,
                                     disability_degree             INTEGER,
                                     disability_card_image_front   UUID,
                                     disability_card_image_back    UUID,
                                     disability_card_expiry_date   DATE,
                                     is_currently_disabled         BOOLEAN,
                                     role                          UUID REFERENCES user_roles(id),
                                     visible_user_id               INTEGER,
                                     created_at                    TIMESTAMPTZ,
                                     updated_at                    TIMESTAMPTZ,
                                     password                      TEXT    NOT NULL
);

-- Artists and Genres
CREATE TABLE IF NOT EXISTS artists (
                                       id           UUID PRIMARY KEY,
                                       name         VARCHAR(255) NOT NULL,
                                       biography    TEXT,
                                       website      VARCHAR(255),
                                       created_at   TIMESTAMPTZ,
                                       updated_at   TIMESTAMPTZ,
                                       artist_image UUID
);

CREATE TABLE IF NOT EXISTS genres (
                                      id   UUID PRIMARY KEY,
                                      name VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS subgenres (
                                         id        UUID PRIMARY KEY,
                                         genre_id  UUID REFERENCES genres(id),
                                         name      TEXT
);

-- Tours
CREATE TABLE IF NOT EXISTS tours (
                                     id         UUID PRIMARY KEY,
                                     title      VARCHAR(255) NOT NULL,
                                     subtitle   VARCHAR(255),
                                     start_date DATE,
                                     end_date   DATE,
                                     created_at TIMESTAMPTZ,
                                     updated_at TIMESTAMPTZ,
                                     tour_image UUID
);

-- Join-tables with composite PKs
CREATE TABLE IF NOT EXISTS tour_artists (
                                            tour_id   UUID REFERENCES tours(id),
                                            artist_id UUID REFERENCES artists(id),
                                            PRIMARY KEY(tour_id, artist_id)
);

CREATE TABLE IF NOT EXISTS tour_genres (
                                           tour_id  UUID REFERENCES tours(id),
                                           genre_id UUID REFERENCES genres(id),
                                           PRIMARY KEY(tour_id, genre_id)
);

CREATE TABLE IF NOT EXISTS tour_subgenres (
                                              tour_id     UUID REFERENCES tours(id),
                                              subgenre_id UUID REFERENCES subgenres(id),
                                              PRIMARY KEY(tour_id, subgenre_id)
);

-- Venues and Areas
CREATE TABLE IF NOT EXISTS venues (
                                      id           UUID PRIMARY KEY,
                                      name         VARCHAR(255) NOT NULL,
                                      address      VARCHAR(500),
                                      city_id      UUID REFERENCES cities(id),
                                      website      VARCHAR(255),
                                      venue_image  UUID,
                                      created_at   TIMESTAMPTZ,
                                      updated_at   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS areas (
                                     id                        UUID PRIMARY KEY,
                                     name                      VARCHAR(50),
                                     description               VARCHAR(100),
                                     disability_category_for   CHAR(3)
);

CREATE TABLE IF NOT EXISTS venue_areas (
                                           id           UUID PRIMARY KEY,
                                           venue_id     UUID REFERENCES venues(id),
                                           max_capacity INTEGER,
                                           area_id      UUID REFERENCES areas(id)
);

-- Events and Categories
CREATE TABLE IF NOT EXISTS events (
                                      id          UUID PRIMARY KEY,
                                      tour_id     UUID REFERENCES tours(id),
                                      venue_id    UUID REFERENCES venues(id),
                                      description TEXT,
                                      created_at  TIMESTAMPTZ,
                                      updated_at  TIMESTAMPTZ,
                                      start_time  TIMESTAMPTZ,
                                      end_time    TIMESTAMPTZ,
                                      door_time   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS event_categories (
                                                id                        UUID PRIMARY KEY,
                                                event_id                  UUID REFERENCES events(id),
                                                name                      TEXT,
                                                price                     NUMERIC(10,2),
                                                disability_support_for    CHAR(3)
);

CREATE TABLE IF NOT EXISTS event_supporting_acts (
                                                     event_id  UUID REFERENCES events(id),
                                                     artist_id UUID REFERENCES artists(id),
                                                     PRIMARY KEY(event_id, artist_id)
);

CREATE TABLE IF NOT EXISTS event_venue_areas (
                                                 id             UUID PRIMARY KEY,
                                                 event_id       UUID REFERENCES events(id),
                                                 venue_area_id  UUID REFERENCES venue_areas(id),
                                                 capacity       INTEGER,
                                                 category_id    UUID REFERENCES event_categories(id)
);

-- Commerce
CREATE TABLE IF NOT EXISTS carts (
                                     id         UUID PRIMARY KEY,
                                     user_id    UUID REFERENCES users(user_id),
                                     created_at TIMESTAMPTZ,
                                     updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS cart_items (
                                          id                   UUID PRIMARY KEY,
                                          cart_id              UUID REFERENCES carts(id),
                                          event_id             UUID REFERENCES events(id),
                                          event_category_id    UUID REFERENCES event_categories(id),
                                          quantity             INTEGER,
                                          added_at             TIMESTAMPTZ,
                                          is_assistance_ticket BOOLEAN
);

CREATE TABLE IF NOT EXISTS checkouts (
                                         id         UUID PRIMARY KEY,
                                         user_id    UUID REFERENCES users(user_id),
                                         created_at TIMESTAMPTZ,
                                         updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS checkout_items (
                                              id                   UUID PRIMARY KEY,
                                              checkout_id          UUID REFERENCES checkouts(id),
                                              event_category_id    UUID REFERENCES event_categories(id),
                                              event_id             UUID REFERENCES events(id),
                                              quantity             INTEGER,
                                              price                NUMERIC(10,2),
                                              added_at             TIMESTAMPTZ,
                                              is_assistance_ticket BOOLEAN
);

CREATE TABLE IF NOT EXISTS payment_options (
                                               id          UUID PRIMARY KEY,
                                               label       VARCHAR(50),
                                               description VARCHAR(100),
                                               icon_src    VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS shipping_options (
                                                id          UUID PRIMARY KEY,
                                                label       VARCHAR(100),
                                                price       NUMERIC,
                                                description VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS orders (
                                      id                   UUID PRIMARY KEY,
                                      user_id              UUID REFERENCES users(user_id),
                                      created_at           TIMESTAMPTZ,
                                      updated_at           TIMESTAMPTZ,
                                      street_address       VARCHAR(255),
                                      postal_code          VARCHAR(20),
                                      city                 VARCHAR(100),
                                      country              VARCHAR(100),
                                      is_paid              BOOLEAN,
                                      salutation           VARCHAR(20),
                                      first_name           VARCHAR(100),
                                      last_name            VARCHAR(100),
                                      company              VARCHAR(255),
                                      payment_option_id    UUID REFERENCES payment_options(id)
);

CREATE TABLE IF NOT EXISTS tickets (
                                       id                   UUID PRIMARY KEY,
                                       order_id             UUID REFERENCES orders(id),
                                       event_category_id    UUID REFERENCES event_categories(id),
                                       seat_number          VARCHAR(50),
                                       price                NUMERIC(10,2),
                                       created_at           TIMESTAMPTZ,
                                       is_assistance_ticket BOOLEAN
);

CREATE TABLE IF NOT EXISTS order_tickets (
                                             id        UUID PRIMARY KEY,
                                             order_id  UUID REFERENCES orders(id),
                                             ticket_id UUID REFERENCES tickets(id)
);

-- Disability marks
CREATE TABLE IF NOT EXISTS disability_marks (
                                                description VARCHAR(100),
                                                area_id     UUID REFERENCES areas(id),
                                                mark_code   CHAR(3) PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS user_disability_marks (
                                                     user_id  UUID REFERENCES users(user_id),
                                                     mark_code CHAR(3) REFERENCES disability_marks(mark_code),
                                                     PRIMARY KEY(user_id, mark_code)
);

-- Images
CREATE TABLE IF NOT EXISTS images (
                                      id            UUID PRIMARY KEY,
                                      image_data    BYTEA,
                                      image_type    TEXT,
                                      entity_type   TEXT,
                                      entity_id     UUID
);