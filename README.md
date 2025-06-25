# EventimDisabilityIntegration

## Database Schema

```mermaid
classDiagram
 direction BT
 class areas {
    varchar(50) name
    varchar(100) description
    char(3) disability_category_for
    uuid id
 }
 class artist_genres {
    uuid artist_id
    uuid genre_id
 }
 class artists {
    varchar(255) name
    text biography
    varchar(255) website
    timestamp with time zone created_at
    timestamp with time zone updated_at
    uuid artist_image
    uuid id
 }
 class cart_items {
    uuid cart_id
    uuid event_id
    uuid event_category_id
    integer quantity
    timestamp with time zone added_at
    uuid id
 }
 class carts {
    uuid user_id
    timestamp with time zone created_at
    timestamp with time zone updated_at
    uuid id
 }
 class categories {
    uuid event_id
    text name
    numeric price
    uuid id
 }
 class checkout_items {
    uuid checkout_id
    uuid event_category_id
    integer quantity
    numeric(10,2) price
    timestamp with time zone added_at
    uuid event_id
    uuid id
 }
 class checkouts {
    uuid user_id
    timestamp with time zone created_at
    timestamp with time zone updated_at
    uuid id
 }
 class cities {
    varchar(100) name
    uuid country_id
    uuid id
 }
 class countries {
    varchar(100) name
    char(2) iso_code
    uuid id
 }
 class disability_marks {
    varchar(100) description
    uuid area_id
    char(3) mark_code
 }
 class event_categories {
    uuid event_id
    text name
    numeric(10,2) price
    char(3) disability_support_for
    uuid id
 }
 class event_supporting_acts {
    uuid event_id
    uuid artist_id
 }
 class event_venue_areas {
    uuid event_id
    uuid venue_area_id
    integer capacity
    uuid category_id
    uuid id
 }
 class events {
    uuid tour_id
    uuid venue_id
    text description
    timestamp with time zone created_at
    timestamp with time zone updated_at
    timestamp with time zone start_time
    timestamp with time zone end_time
    timestamp with time zone door_time
    uuid id
 }
 class genres {
    varchar(50) name
    uuid id
 }
 class images {
    bytea image_data
    text image_type
    text entity_type
    uuid entity_id
    uuid id
 }
 class orders {
    uuid checkout_id
    uuid user_id
    timestamp with time zone created_at
    uuid id
 }
 class subgenres {
    uuid genre_id
    text name
    uuid id
 }
 class tickets {
    uuid order_id
    uuid event_category_id
    varchar(50) seat_number
    numeric(10,2) price
    timestamp with time zone created_at
    uuid id
 }
 class tour_artists {
    uuid tour_id
    uuid artist_id
 }
 class tour_genres {
    uuid tour_id
    uuid genre_id
 }
 class tour_subgenres {
    uuid tour_id
    uuid subgenre_id
 }
 class tours {
    varchar(255) title
    varchar(255) subtitle
    date start_date
    date end_date
    timestamp with time zone created_at
    timestamp with time zone updated_at
    uuid tour_image
    uuid id
 }
 class user_disability_marks {
    uuid user_id
    char(3) mark_code
 }
 class users {
    varchar(20) salutation
    varchar(100) first_name
    varchar(100) last_name
    varchar(255) company
    varchar(255) street_address
    varchar(20) postal_code
    varchar(100) city
    varchar(100) country
    varchar(255) email
    varchar(20) phone
    date birth_date
    boolean request_for_disability
    integer disability_degree
    uuid disability_card_image_front
    timestamp with time zone created_at
    timestamp with time zone updated_at
    text password
    uuid disability_card_image_back
    boolean is_currently_disabled
    date disability_card_expiry_date
    uuid user_id
}
 class venue_areas {
    uuid venue_id
    integer max_capacity
    uuid area_id
    uuid id
 }
 class venues {
    varchar(255) name
    varchar(500) address
    uuid city_id
    varchar(255) website
    timestamp with time zone created_at
    timestamp with time zone updated_at
    uuid id
 }

 artist_genres  -->  artists : artist_id:id
 artist_genres  -->  genres : genre_id:id
 cart_items  -->  carts : cart_id:id
 cart_items  -->  event_categories : event_category_id:id
 cart_items  -->  events : event_id:id
 carts  -->  users : user_id
 categories  -->  events : event_id:id
 checkout_items  -->  checkouts : checkout_id:id
 checkout_items  -->  event_categories : event_category_id:id
 checkout_items  -->  events : event_id:id
 checkouts  -->  users : user_id
 cities  -->  countries : country_id:id
 disability_marks  -->  areas : area_id:id
 event_categories  -->  events : event_id:id
 event_supporting_acts  -->  artists : artist_id:id
 event_supporting_acts  -->  events : event_id:id
 event_venue_areas  -->  categories : category_id:id
 event_venue_areas  -->  event_categories : category_id:id
 event_venue_areas  -->  events : event_id:id
 event_venue_areas  -->  venue_areas : venue_area_id:id
 events  -->  tours : tour_id:id
 events  -->  venues : venue_id:id
 orders  -->  checkouts : checkout_id:id
 orders  -->  users : user_id
 subgenres  -->  genres : genre_id:id
 tickets  -->  event_categories : event_category_id:id
 tickets  -->  orders : order_id:id
 tour_artists  -->  artists : artist_id:id
 tour_artists  -->  tours : tour_id:id
 tour_genres  -->  genres : genre_id:id
 tour_genres  -->  tours : tour_id:id
 tour_subgenres  -->  subgenres : subgenre_id:id
 tour_subgenres  -->  tours : tour_id:id
 user_disability_marks  -->  disability_marks : mark_code
 user_disability_marks  -->  users : user_id
 venue_areas  -->  areas : area_id:id
 venue_areas  -->  venues : venue_id:id
 venues  -->  cities : city_id:id
```
