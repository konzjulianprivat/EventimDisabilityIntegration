-- Basic schema backup to recreate database tables

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Countries and Cities
CREATE TABLE IF NOT EXISTS countries (
    id uuid PRIMARY KEY,
    name varchar(100) NOT NULL,
    iso_code char(2)
);

CREATE TABLE IF NOT EXISTS cities (
    id uuid PRIMARY KEY,
    name varchar(100) NOT NULL,
    country_id uuid REFERENCES countries(id)
);

-- Users and roles
CREATE TABLE IF NOT EXISTS user_roles (
    id uuid PRIMARY KEY,
    name varchar(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    user_id uuid PRIMARY KEY,
    first_name varchar(100) NOT NULL,
    last_name varchar(100) NOT NULL,
    email varchar(255) NOT NULL,
    password text NOT NULL,
    birth_date date,
    phone varchar(20),
    request_for_disability boolean,
    disability_degree integer,
    street_address varchar(255),
    city varchar(100),
    postal_code varchar(20),
    country varchar(100),
    company varchar(255),
    salutation varchar(20),
    disability_card_image_front uuid,
    disability_card_image_back uuid,
    disability_card_expiry_date date,
    is_currently_disabled boolean,
    role uuid REFERENCES user_roles(id),
    visible_user_id integer,
    created_at timestamptz,
    updated_at timestamptz
);

-- Artists and Genres
CREATE TABLE IF NOT EXISTS artists (
    id uuid PRIMARY KEY,
    name varchar(255) NOT NULL,
    biography text,
    website varchar(255),
    created_at timestamptz,
    updated_at timestamptz,
    artist_image uuid
);

CREATE TABLE IF NOT EXISTS genres (
    id uuid PRIMARY KEY,
    name varchar(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS subgenres (
    id uuid PRIMARY KEY,
    genre_id uuid REFERENCES genres(id),
    name text
);

CREATE TABLE IF NOT EXISTS artist_genres (
    artist_id uuid REFERENCES artists(id),
    genre_id uuid REFERENCES genres(id)
);

-- Tours and related tables
CREATE TABLE IF NOT EXISTS tours (
    id uuid PRIMARY KEY,
    title varchar(255) NOT NULL,
    subtitle varchar(255),
    start_date date,
    end_date date,
    created_at timestamptz,
    updated_at timestamptz,
    tour_image uuid
);

CREATE TABLE IF NOT EXISTS tour_artists (
    tour_id uuid REFERENCES tours(id),
    artist_id uuid REFERENCES artists(id)
);

CREATE TABLE IF NOT EXISTS tour_genres (
    tour_id uuid REFERENCES tours(id),
    genre_id uuid REFERENCES genres(id)
);

CREATE TABLE IF NOT EXISTS tour_subgenres (
    tour_id uuid REFERENCES tours(id),
    subgenre_id uuid REFERENCES subgenres(id)
);

-- Venues and areas
CREATE TABLE IF NOT EXISTS venues (
    id uuid PRIMARY KEY,
    name varchar(255) NOT NULL,
    address varchar(500),
    city_id uuid REFERENCES cities(id),
    website varchar(255),
    created_at timestamptz,
    updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS areas (
    id uuid PRIMARY KEY,
    name varchar(50),
    description varchar(100),
    disability_category_for char(3)
);

CREATE TABLE IF NOT EXISTS venue_areas (
    id uuid PRIMARY KEY,
    venue_id uuid REFERENCES venues(id),
    max_capacity integer,
    area_id uuid REFERENCES areas(id)
);

CREATE TABLE IF NOT EXISTS event_venue_areas (
    id uuid PRIMARY KEY,
    event_id uuid REFERENCES events(id),
    venue_area_id uuid REFERENCES venue_areas(id),
    capacity integer,
    category_id uuid
);

-- Events and categories
CREATE TABLE IF NOT EXISTS events (
    id uuid PRIMARY KEY,
    tour_id uuid REFERENCES tours(id),
    venue_id uuid REFERENCES venues(id),
    description text,
    created_at timestamptz,
    updated_at timestamptz,
    start_time timestamptz,
    end_time timestamptz,
    door_time timestamptz
);

CREATE TABLE IF NOT EXISTS event_categories (
    id uuid PRIMARY KEY,
    event_id uuid REFERENCES events(id),
    name text,
    price numeric(10,2),
    disability_support_for char(3)
);

CREATE TABLE IF NOT EXISTS event_supporting_acts (
    event_id uuid REFERENCES events(id),
    artist_id uuid REFERENCES artists(id)
);

-- Commerce tables
CREATE TABLE IF NOT EXISTS carts (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES users(user_id),
    created_at timestamptz,
    updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS cart_items (
    id uuid PRIMARY KEY,
    cart_id uuid REFERENCES carts(id),
    event_id uuid REFERENCES events(id),
    event_category_id uuid REFERENCES event_categories(id),
    quantity integer,
    added_at timestamptz,
    is_assistance_ticket boolean
);

CREATE TABLE IF NOT EXISTS checkouts (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES users(user_id),
    created_at timestamptz,
    updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS checkout_items (
    id uuid PRIMARY KEY,
    checkout_id uuid REFERENCES checkouts(id),
    event_category_id uuid REFERENCES event_categories(id),
    event_id uuid REFERENCES events(id),
    quantity integer,
    price numeric(10,2),
    added_at timestamptz,
    is_assistance_ticket boolean
);

CREATE TABLE IF NOT EXISTS orders (
    id uuid PRIMARY KEY,
    checkout_id uuid REFERENCES checkouts(id),
    user_id uuid REFERENCES users(user_id),
    created_at timestamptz,
    street_address varchar(255),
    postal_code varchar(20),
    city varchar(100),
    country varchar(100),
    is_paid boolean,
    salutation varchar(20),
    first_name varchar(100),
    last_name varchar(100),
    company varchar(255),
    payment_option_id uuid
);

CREATE TABLE IF NOT EXISTS tickets (
    id uuid PRIMARY KEY,
    order_id uuid REFERENCES orders(id),
    event_category_id uuid REFERENCES event_categories(id),
    seat_number varchar(50),
    price numeric(10,2),
    created_at timestamptz,
    is_assistance_ticket boolean
);

CREATE TABLE IF NOT EXISTS payment_options (
    id uuid PRIMARY KEY,
    label varchar(50),
    description varchar(100),
    icon_src varchar(50)
);

CREATE TABLE IF NOT EXISTS shipping_options (
    id uuid PRIMARY KEY,
    label varchar(100),
    price numeric,
    description varchar(100)
);

CREATE TABLE IF NOT EXISTS disability_marks (
    mark_code char(3) PRIMARY KEY,
    description varchar(100),
    area_id uuid REFERENCES areas(id)
);

CREATE TABLE IF NOT EXISTS user_disability_marks (
    user_id uuid REFERENCES users(user_id),
    mark_code char(3) REFERENCES disability_marks(mark_code)
);

CREATE TABLE IF NOT EXISTS images (
    id uuid PRIMARY KEY,
    image_data bytea,
    image_type text,
    entity_type text,
    entity_id uuid
);

CREATE TABLE IF NOT EXISTS order_tickets (
    id uuid PRIMARY KEY,
    order_id uuid REFERENCES orders(id),
    ticket_id uuid REFERENCES tickets(id)
);
