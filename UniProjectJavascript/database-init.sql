--
-- PostgreSQL database dump
--

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

-- Started on 2026-02-07 23:46:28

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 225 (class 1259 OID 16581)
-- Name: active_blackjack; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.active_blackjack (
    user_id uuid NOT NULL,
    deck text NOT NULL,
    player_hand text NOT NULL,
    dealer_hand text NOT NULL,
    bet integer DEFAULT 0,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.active_blackjack OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16556)
-- Name: audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    status integer NOT NULL,
    event character varying(255) NOT NULL,
    error character varying(255),
    created timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid NOT NULL
);


ALTER TABLE public.audit_log OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16565)
-- Name: ban_list; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ban_list (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    reason character varying(255) NOT NULL,
    description character varying(255) NOT NULL,
    ban_from timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ban_to timestamp without time zone DEFAULT (CURRENT_TIMESTAMP + '00:05:00'::interval),
    created_by uuid NOT NULL,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.ban_list OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16544)
-- Name: game_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.game_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    game_type character varying(50) NOT NULL,
    game_status character varying(50) NOT NULL,
    won_amount integer NOT NULL,
    created timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.game_history OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16532)
-- Name: payment_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    payed_amount integer NOT NULL,
    payment_type character varying(50) NOT NULL,
    bought_currency integer NOT NULL,
    payment_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.payment_history OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16519)
-- Name: payment_info; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_info (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    card_number character varying(50) NOT NULL,
    ccv character varying(50) NOT NULL,
    card_date character varying(10) NOT NULL,
    card_holder character varying(100) NOT NULL,
    user_id uuid
);


ALTER TABLE public.payment_info OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 16496)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(50) NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16504)
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    user_id uuid NOT NULL,
    role_id uuid NOT NULL
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16479)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    nickname character varying(50),
    age_verified boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_modified timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    currency integer DEFAULT 0,
    banned boolean DEFAULT false
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 4385 (class 0 OID 16581)
-- Dependencies: 225
-- Data for Name: active_blackjack; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.active_blackjack (user_id, deck, player_hand, dealer_hand, bet, updated_at) FROM stdin;
\.


--
-- TOC entry 4383 (class 0 OID 16556)
-- Dependencies: 223
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_log (id, status, event, error, created, created_by) FROM stdin;
1aafadaa-f8e8-45cb-ade2-0f121b90d98b	500	User login failed	secretOrPrivateKey must have a value	2026-02-07 15:47:08.745	00000000-0000-0000-0000-000000000000
19b390cb-b037-491e-a12b-af5beea27b37	500	User login failed	secretOrPrivateKey must have a value	2026-02-07 15:52:23.437	00000000-0000-0000-0000-000000000000
d04d58e1-6239-4d76-8bf4-caaf4652d757	401	Failed login attempt	Username: Daniel	2026-02-07 17:53:26.37	00000000-0000-0000-0000-000000000000
2142c2c3-5397-4afb-9283-1a78959c03f4	401	Failed login attempt	Username: dummas	2026-02-07 17:56:32.622	00000000-0000-0000-0000-000000000000
8e54c462-ea22-45a3-bd56-ac2a9e4ba0d7	500	User queries	Update currency failed: Insufficient currency	2026-02-07 18:32:33.849	6c3e2689-431f-41cf-8d1e-ebedd8861526
2b81aa89-6122-4732-82f2-d078f09f4e4c	401	Failed login attempt	Username: Daniel	2026-02-07 18:45:10.498	00000000-0000-0000-0000-000000000000
7680ce83-a530-40f1-805e-ed02234c88d5	500	Payment queries	Add payment info failed: duplicate key value violates unique constraint "payment_info_card_number_key"	2026-02-07 19:33:51.96	6c3e2689-431f-41cf-8d1e-ebedd8861526
e4259f08-6968-499a-bb7d-2f6a85d21c02	500	User router error	Problem with adding payment info: duplicate key value violates unique constraint "payment_info_card_number_key"	2026-02-07 19:33:51.997	6c3e2689-431f-41cf-8d1e-ebedd8861526
5be3227a-bd47-43e0-9010-8ed3e9ad6cb0	500	User queries	Update currency failed: Insufficient currency	2026-02-07 21:28:59.43	7ca71eb6-4d61-4b49-a774-ef2ffb025813
16ae939c-2a2d-436a-b9b4-21165854f7d8	500	Payment queries	Payment operation failed: No payment information found for the user.	2026-02-07 21:29:39.49	7ca71eb6-4d61-4b49-a774-ef2ffb025813
a527c3e3-1f70-469c-acce-f58e6076ee11	500	Payment queries	Add payment info failed: duplicate key value violates unique constraint "payment_info_card_number_key"	2026-02-07 21:30:02.337	7ca71eb6-4d61-4b49-a774-ef2ffb025813
2bb8d90f-eb02-4042-9b2b-b018cbe77ba5	500	User router error	Problem with adding payment info: duplicate key value violates unique constraint "payment_info_card_number_key"	2026-02-07 21:30:02.384	7ca71eb6-4d61-4b49-a774-ef2ffb025813
c11ad647-e8be-4893-a1ea-a7f70eec0e84	500	Payment queries	Payment operation failed: No payment information found for the user.	2026-02-07 21:30:07.208	7ca71eb6-4d61-4b49-a774-ef2ffb025813
\.


--
-- TOC entry 4384 (class 0 OID 16565)
-- Dependencies: 224
-- Data for Name: ban_list; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ban_list (id, user_id, reason, description, ban_from, ban_to, created_by, is_deleted) FROM stdin;
dbf3717f-8f76-4848-8c6e-abc249a640c3	6c3e2689-431f-41cf-8d1e-ebedd8861526	łamanie regulaminu	12	2026-02-07 20:37:59.017	2026-02-14 20:37:59.017	cf7169cf-1449-4fad-9448-99cdd8214bd4	t
765a26f6-4a38-47fb-bf61-2a0bfb27f0c7	6c3e2689-431f-41cf-8d1e-ebedd8861526	oszukana waluta	beka troche	2026-02-07 20:46:05.043	2027-02-07 20:46:05.043	cf7169cf-1449-4fad-9448-99cdd8214bd4	f
c3beafb6-a1f3-4463-b0d5-fb3d682e753e	cc6c2fbe-282c-4d9c-ada2-5394329cebb9	nic	nie zrobil nic zlego, tylko dla zasady	2025-12-19 00:00:00	2025-12-31 00:00:00	cf7169cf-1449-4fad-9448-99cdd8214bd4	t
6fbf33d5-165a-49a9-8ca7-1c934fc1a9b8	cc6c2fbe-282c-4d9c-ada2-5394329cebb9	nic	nie zrobil nic zlego, tylko dla zasady	2025-12-19 00:00:00	2025-12-31 00:00:00	cf7169cf-1449-4fad-9448-99cdd8214bd4	t
\.


--
-- TOC entry 4382 (class 0 OID 16544)
-- Dependencies: 222
-- Data for Name: game_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.game_history (id, user_id, game_type, game_status, won_amount, created) FROM stdin;
e13c80ef-75fc-4a37-bdd7-58a8aadc3936	6c3e2689-431f-41cf-8d1e-ebedd8861526	roulette	lose	0	2026-02-07 19:01:30.962826
383a8ab2-b650-41f0-a36c-1ef089848b44	6c3e2689-431f-41cf-8d1e-ebedd8861526	blackjack	lose	0	2026-02-07 19:01:38.008471
29894375-db9f-49dc-9b26-d116733dbe6e	6c3e2689-431f-41cf-8d1e-ebedd8861526	slots	lose	0	2026-02-07 19:01:44.540194
c88cd9ce-b3e3-4a1c-9bd5-eea7e35f7182	6c3e2689-431f-41cf-8d1e-ebedd8861526	slots	lose	0	2026-02-07 19:01:56.9741
1fef8458-a419-4f07-a179-41098dc6f5ac	6c3e2689-431f-41cf-8d1e-ebedd8861526	slots	lose	0	2026-02-07 19:01:59.540548
6ffa8e9f-e6b5-45ca-92c2-8453b321f964	6c3e2689-431f-41cf-8d1e-ebedd8861526	slots	lose	0	2026-02-07 19:02:02.09119
08579fcc-97fc-41a6-9a94-149a7f8b3167	6c3e2689-431f-41cf-8d1e-ebedd8861526	slots	lose	0	2026-02-07 19:02:04.897594
a7a0679d-7373-4ddc-a3d0-459b5d47a5d4	6c3e2689-431f-41cf-8d1e-ebedd8861526	slots	lose	0	2026-02-07 19:02:07.434396
697d3994-dc62-47a5-9814-3bc2d241a8c7	6c3e2689-431f-41cf-8d1e-ebedd8861526	slots	lose	0	2026-02-07 19:02:09.991959
c3616983-3e43-4202-9efa-972977bf9406	6c3e2689-431f-41cf-8d1e-ebedd8861526	slots	lose	0	2026-02-07 19:02:12.792645
279bc9b6-48ed-40e7-82c9-61c9ddcaae5c	6c3e2689-431f-41cf-8d1e-ebedd8861526	slots	win	20	2026-02-07 19:03:33.080319
49b82c6d-f01e-4830-b658-6ef2ac3bff9f	6c3e2689-431f-41cf-8d1e-ebedd8861526	slots	win	20	2026-02-07 19:03:37.748362
7c436f4a-159d-4773-b6bb-979959aa4777	7ca71eb6-4d61-4b49-a774-ef2ffb025813	roulette	lose	0	2026-02-07 21:30:50.881877
0236b74b-97dc-43c5-9828-362c15d0f95a	7ca71eb6-4d61-4b49-a774-ef2ffb025813	roulette	lose	0	2026-02-07 21:30:54.020496
a2da5cec-a16f-4dd6-a043-15b4e525bc80	7ca71eb6-4d61-4b49-a774-ef2ffb025813	roulette	lose	0	2026-02-07 21:31:00.721922
739685c7-2ee1-4b4b-b61f-c61f86bfcf02	7ca71eb6-4d61-4b49-a774-ef2ffb025813	roulette	lose	0	2026-02-07 21:31:04.059099
a1a152ca-597d-4ab2-b67c-a7d1e98ceced	7ca71eb6-4d61-4b49-a774-ef2ffb025813	roulette	lose	0	2026-02-07 21:31:06.117724
c9b96b62-a168-49aa-84a2-39c18285a368	7ca71eb6-4d61-4b49-a774-ef2ffb025813	roulette	lose	0	2026-02-07 21:31:12.15963
5e122d03-293a-44d7-b28b-0805e37c98ab	7ca71eb6-4d61-4b49-a774-ef2ffb025813	blackjack	win	20000	2026-02-07 21:31:43.840165
a2813288-1329-49e5-aed2-066f8587f7f7	7ca71eb6-4d61-4b49-a774-ef2ffb025813	blackjack	lose	0	2026-02-07 21:32:02.943628
801fbec5-d358-4adf-9b10-02263a95c398	7ca71eb6-4d61-4b49-a774-ef2ffb025813	blackjack	win	25000	2026-02-07 21:32:04.889045
4a0315a9-b14c-42c8-978e-2e9cbfb9f766	7ca71eb6-4d61-4b49-a774-ef2ffb025813	slots	win	16000	2026-02-07 21:32:18.879312
\.


--
-- TOC entry 4381 (class 0 OID 16532)
-- Dependencies: 221
-- Data for Name: payment_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_history (id, user_id, payed_amount, payment_type, bought_currency, payment_date) FROM stdin;
3862da4c-fa4a-4ee7-a741-4f7faaeaa56e	6c3e2689-431f-41cf-8d1e-ebedd8861526	20	card	200	2026-02-07 19:33:43.79835
bfa174e7-15d4-4307-801b-6c40ea9e723c	6c3e2689-431f-41cf-8d1e-ebedd8861526	20	card	200	2026-02-07 19:33:56.694522
54748625-5356-49e9-a135-fafbb1ffa0c9	6c3e2689-431f-41cf-8d1e-ebedd8861526	20	card	200	2026-02-07 19:33:59.809365
358c4a04-166c-4326-b4bd-a32dbd0ed151	6c3e2689-431f-41cf-8d1e-ebedd8861526	250	card	100	2026-02-07 19:36:04.015492
99be81fd-9f71-499c-a04b-95c405d4b5c9	6c3e2689-431f-41cf-8d1e-ebedd8861526	250	card	100	2026-02-07 19:36:24.666937
f279e3c6-e1c9-4793-81cb-189b941f4ee8	6c3e2689-431f-41cf-8d1e-ebedd8861526	20	card	200	2026-02-07 19:36:53.859694
aba5f361-e87a-462d-aeee-116c752ab694	6c3e2689-431f-41cf-8d1e-ebedd8861526	20	card	200	2026-02-07 19:38:11.640983
64647ae5-61f2-4be5-a863-dfb589524968	6c3e2689-431f-41cf-8d1e-ebedd8861526	20	card	200	2026-02-07 19:38:44.431418
1dedc309-57c8-40ba-9e1d-6d26db860d84	6c3e2689-431f-41cf-8d1e-ebedd8861526	20	card	200	2026-02-07 19:39:00.519954
d66a7f75-cfe0-43da-ab4a-70e82542fc59	6c3e2689-431f-41cf-8d1e-ebedd8861526	20	card	200	2026-02-07 19:40:37.427378
1fde5a50-8dff-409e-845c-f90c32c23942	6c3e2689-431f-41cf-8d1e-ebedd8861526	20	card	200	2026-02-07 19:41:07.787819
23234c49-7236-4d33-8fc5-99ea929dde6d	6c3e2689-431f-41cf-8d1e-ebedd8861526	20	card	200	2026-02-07 19:42:37.252177
bf96875e-b737-4244-afc7-4089df7da5fa	6c3e2689-431f-41cf-8d1e-ebedd8861526	20	card	200	2026-02-07 19:42:43.510118
14c3ae82-c0fc-4ecc-a5e7-fa7bda884162	6c3e2689-431f-41cf-8d1e-ebedd8861526	20	card	200	2026-02-07 19:43:43.818554
2758ca4b-f3e3-4089-81ee-649930b8c78d	6c3e2689-431f-41cf-8d1e-ebedd8861526	20	card	200	2026-02-07 19:43:50.475289
4315f571-ddf5-4339-ac20-6ec9c38660f0	6c3e2689-431f-41cf-8d1e-ebedd8861526	600	card	6600	2026-02-07 19:43:58.478965
5a6c3bfb-37ab-48d3-8b54-c324581d807d	7ca71eb6-4d61-4b49-a774-ef2ffb025813	600	card	6600	2026-02-07 21:30:39.887216
47641475-5e8a-43ff-b130-bdd06ab6e56a	7ca71eb6-4d61-4b49-a774-ef2ffb025813	600	card	6600	2026-02-07 21:31:20.279706
ef0e09e5-9801-445b-8730-14f4f4325f0a	7ca71eb6-4d61-4b49-a774-ef2ffb025813	600	card	6600	2026-02-07 21:31:22.896431
\.


--
-- TOC entry 4380 (class 0 OID 16519)
-- Dependencies: 220
-- Data for Name: payment_info; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_info (id, card_number, ccv, card_date, card_holder, user_id) FROM stdin;
1efad5b7-9c80-445d-bf70-2b0a4a10a71f	4000000000000000	123	08/29	Daniel D	6c3e2689-431f-41cf-8d1e-ebedd8861526
72e998b5-8afd-40a0-b403-f681c93daecb	4200000000000000	321	01/29	Buta Humak	7ca71eb6-4d61-4b49-a774-ef2ffb025813
\.


--
-- TOC entry 4378 (class 0 OID 16496)
-- Dependencies: 218
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name) FROM stdin;
1a2b3c4d-1111-2222-3333-444455556666	admin
2b3c4d5e-2222-3333-4444-555566667777	user
\.


--
-- TOC entry 4379 (class 0 OID 16504)
-- Dependencies: 219
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_roles (user_id, role_id) FROM stdin;
cc6c2fbe-282c-4d9c-ada2-5394329cebb9	1a2b3c4d-1111-2222-3333-444455556666
dd7d3fce-393d-5e0d-beb3-640543adfcc0	2b3c4d5e-2222-3333-4444-555566667777
cf7169cf-1449-4fad-9448-99cdd8214bd4	1a2b3c4d-1111-2222-3333-444455556666
6c3e2689-431f-41cf-8d1e-ebedd8861526	2b3c4d5e-2222-3333-4444-555566667777
86e96f45-b851-454a-9dfc-156ff4258cc1	2b3c4d5e-2222-3333-4444-555566667777
29e30089-3f7b-4606-b8b6-c38312eb4d8b	2b3c4d5e-2222-3333-4444-555566667777
39db892c-dac4-48ca-ad57-3ac92043ad50	2b3c4d5e-2222-3333-4444-555566667777
6be847f2-c2cb-477a-bfbb-adf253ca795c	2b3c4d5e-2222-3333-4444-555566667777
6eb7f8e0-62b3-450c-88de-68a24abea08d	2b3c4d5e-2222-3333-4444-555566667777
71ae50a7-8a9f-4e3e-ae26-d15e75020160	2b3c4d5e-2222-3333-4444-555566667777
308df183-1322-4e41-8de9-b69e3684ad25	2b3c4d5e-2222-3333-4444-555566667777
ea8b580b-0ab0-4e6c-8ea0-aaa5d4ad36c2	1a2b3c4d-1111-2222-3333-444455556666
cc259d8f-5daf-4646-9918-2e56d4d12fcd	1a2b3c4d-1111-2222-3333-444455556666
7ca71eb6-4d61-4b49-a774-ef2ffb025813	2b3c4d5e-2222-3333-4444-555566667777
5b3ec0a1-49a3-4f4c-81db-51da495b44d7	1a2b3c4d-1111-2222-3333-444455556666
\.


--
-- TOC entry 4377 (class 0 OID 16479)
-- Dependencies: 217
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, password_hash, nickname, age_verified, created_at, last_modified, currency, banned) FROM stdin;
dd7d3fce-393d-5e0d-beb3-640543adfcc0	eva	eva@testmail.com	"$2b$10$z/SEfvTRArbzOcKpj1yGBOYZ9.x/Vwy7g9MjIsNXY/..04J6oTbay"	\N	t	2026-02-07 15:21:57.700456	2026-02-07 15:21:57.700456	0	f
86e96f45-b851-454a-9dfc-156ff4258cc1	Daniel2	Daniel2@testmail.com	$2b$10$QdBp3dQWnQwZ3i9GWEKguu2JmTZw0kD5J7Xlt9Jm0rFEGLVL0dRJK	\N	t	2026-02-07 16:32:45.99	2026-02-07 16:32:45.99	0	f
ea8b580b-0ab0-4e6c-8ea0-aaa5d4ad36c2	Daniel234	Daniel234@testmail.com	$2b$10$KXyax7C0BMbaEe/7t/Ona.MBLHX89HiEmv6/1oq0lJu/SC6r0lhvu	\N	t	2026-02-07 16:34:34.744	2026-02-07 16:34:34.744	0	f
6be847f2-c2cb-477a-bfbb-adf253ca795c	Daniel23456	Daniel23456@testmail.com	$2b$10$nVYepWTZwPH7gMpIm7FIQOJBjU5pZOGT7WtkcqPoiu.GMk6FDktkG	\N	t	2026-02-07 16:37:40.776	2026-02-07 16:37:40.776	0	f
6eb7f8e0-62b3-450c-88de-68a24abea08d	Daniel234567	Daniel234567@testmail.com	$2b$10$DiDqeiwzfBZjjLzy/Mu27eIu0xjiZ8F0hhY3L6NBiiy9nLG5m.ptO	\N	t	2026-02-07 16:39:34.044	2026-02-07 16:39:34.044	0	f
71ae50a7-8a9f-4e3e-ae26-d15e75020160	Daniel2345678	Daniel2345678@testmail.com	$2b$10$5Td0BIKPghol9gNYkZciDe9H660CqGSAPERbGwE6HHkorM9Bxy.DO	\N	t	2026-02-07 16:39:57.565	2026-02-07 16:39:57.565	0	f
cc259d8f-5daf-4646-9918-2e56d4d12fcd	Dan	dan@testmail.com	$2b$10$AvJYQQdjtgLAC6nUiMkeEOymlnZ3ypjLjhxlsVv4j.3cka.M4w51G	\N	t	2026-02-07 16:41:50.425	2026-02-07 16:41:50.425	0	f
308df183-1322-4e41-8de9-b69e3684ad25	Da	da@testmail.com	$2b$10$.mQGOl9NWxJHi/z8x2Hc6uLa.5n5CcbG1VPCljv.o504jr/2xtjlW	\N	t	2026-02-07 16:42:52.186	2026-02-07 16:42:52.186	0	f
29e30089-3f7b-4606-b8b6-c38312eb4d8b	Daniel23	Daniel23@testmail.com	$2b$10$UfRdS8.oZ0jrYy2qhuZCRuododA2TtOhEbS3xTER0f11vrtqT8LSi	\N	t	2026-02-06 16:33:46.918	2026-02-06 16:33:46.918	0	f
cf7169cf-1449-4fad-9448-99cdd8214bd4	dummas	dummy@testmail.com	$2b$10$Hi26I0g/e7Qds.WOvEsmJuQoDx6sv3fCDhcCnwYFPIvX/9ubH2j7O	\N	t	2026-02-07 15:47:04.309	2026-02-07 15:47:04.309	1500	f
39db892c-dac4-48ca-ad57-3ac92043ad50	Daniel2345	Daniel2345@testmail.com	$2b$10$tI9LVU9P7bT.D5f1j510cOSupu43E4TGig5IS9Pb/64MRBz6P95/m	\N	t	2026-02-05 16:36:34.054	2026-02-05 16:36:34.054	0	f
cc6c2fbe-282c-4d9c-ada2-5394329cebb9	adam	adam@testmail.com	"$2b$10$oX15JPNS12Z3ldu0/Hr8meQx1pIe1KoW0h7.W9kErkFaJN4eDMvIq"	\N	t	2026-02-07 15:21:57.700456	2026-02-07 15:21:57.700456	0	f
7ca71eb6-4d61-4b49-a774-ef2ffb025813	Guest	guest@testmail.com	$2b$10$/y2oZgzZgNPYem.xZdr0XuRKkfntfIcj4/4xAEx7Dvlp4q7PRKGUO	\N	t	2026-02-07 21:08:55.7	2026-02-07 21:32:18.769	26780	f
6c3e2689-431f-41cf-8d1e-ebedd8861526	Daniel	Daniel@testmail.com	$2b$10$zcxEnelRUtpFQZS5aA4c6uJAqslCwtTBatmZVcDG2qaMdpAnF3CnS	Danielek	t	2026-02-07 16:27:30.607	2026-02-07 19:03:37.652	9850	t
5b3ec0a1-49a3-4f4c-81db-51da495b44d7	Admin	admin@testmail.com	$2b$10$DyRVbDoz9fzwFnJYrtiIgeVGS9E3JV4sUHdN02ows36NLNXtSBrJC	\N	t	2026-02-07 21:09:35.575	2026-02-07 21:09:35.575	0	f
\.


--
-- TOC entry 4225 (class 2606 OID 16589)
-- Name: active_blackjack active_blackjack_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.active_blackjack
    ADD CONSTRAINT active_blackjack_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4221 (class 2606 OID 16564)
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- TOC entry 4223 (class 2606 OID 16575)
-- Name: ban_list ban_list_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ban_list
    ADD CONSTRAINT ban_list_pkey PRIMARY KEY (id);


--
-- TOC entry 4219 (class 2606 OID 16550)
-- Name: game_history game_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.game_history
    ADD CONSTRAINT game_history_pkey PRIMARY KEY (id);


--
-- TOC entry 4217 (class 2606 OID 16538)
-- Name: payment_history payment_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_history
    ADD CONSTRAINT payment_history_pkey PRIMARY KEY (id);


--
-- TOC entry 4213 (class 2606 OID 16526)
-- Name: payment_info payment_info_card_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_info
    ADD CONSTRAINT payment_info_card_number_key UNIQUE (card_number);


--
-- TOC entry 4215 (class 2606 OID 16524)
-- Name: payment_info payment_info_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_info
    ADD CONSTRAINT payment_info_pkey PRIMARY KEY (id);


--
-- TOC entry 4207 (class 2606 OID 16503)
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- TOC entry 4209 (class 2606 OID 16501)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 4211 (class 2606 OID 16508)
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- TOC entry 4199 (class 2606 OID 16493)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4201 (class 2606 OID 16495)
-- Name: users users_nickname_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_nickname_key UNIQUE (nickname);


--
-- TOC entry 4203 (class 2606 OID 16489)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4205 (class 2606 OID 16491)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 4231 (class 2606 OID 16576)
-- Name: ban_list ban_list_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ban_list
    ADD CONSTRAINT ban_list_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4230 (class 2606 OID 16551)
-- Name: game_history game_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.game_history
    ADD CONSTRAINT game_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4229 (class 2606 OID 16539)
-- Name: payment_history payment_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_history
    ADD CONSTRAINT payment_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4228 (class 2606 OID 16527)
-- Name: payment_info payment_info_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_info
    ADD CONSTRAINT payment_info_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4226 (class 2606 OID 16514)
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- TOC entry 4227 (class 2606 OID 16509)
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2026-02-07 23:46:32

--
-- PostgreSQL database dump complete
--

