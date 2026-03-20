import { Accordion, Text, Title, List, Stack, Alert } from '@mantine/core';
import { IconInfoCircle, IconClock, IconCalendar, IconUsers, IconWifiOff, IconSettings, IconPlus, IconFileDescription } from '@tabler/icons-react';

export default function UserGuideView() {
    return (
        <Stack gap="lg">
             <Title order={3}>Manuale Utente</Title>
             <Text c="dimmed">Benvenuto nella guida completa della tua Agenda Servizio. Qui trovi tutto quello che c'è da sapere sulle funzionalità dell'app.</Text>

             <Accordion variant="separated" radius="md" chevronPosition="left">
                
                <Accordion.Item value="intro">
                    <Accordion.Control icon={<IconInfoCircle size={20} color="blue" />}>
                        Introduzione
                    </Accordion.Control>
                    <Accordion.Panel>
                        <Text size="sm">
                            Questa applicazione è il tuo assistente personale per il servizio.
                            Non è solo un cronometro, ma un vero e proprio gestionale per:
                            <List size="sm" mt="xs" spacing={4} withPadding>
                                <List.Item>Registrare il tempo di servizio.</List.Item>
                                <List.Item>Gestire una <b>Rubrica Globale</b> dei tuoi contatti.</List.Item>
                                <List.Item>Tenere traccia delle visite e delle pubblicazioni consegnate.</List.Item>
                                <List.Item>Monitorare i tuoi obiettivi mensili.</List.Item>
                            </List>
                        </Text>
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="header_menu">
                    <Accordion.Control icon={<IconPlus size={20} color="green" />}>
                        Il Menu "Nuovo" (in alto a destra)
                    </Accordion.Control>
                    <Accordion.Panel>
                        <Stack gap="xs">
                            <Text size="sm">
                                In alto a destra trovi un pulsante col simbolo <b>+</b>. Cliccandolo si apre un menu con due opzioni:
                            </Text>
                            <List size="sm" spacing="xs">
                                <List.Item>
                                    <b>Uscita Servizio</b>: Apre la finestra per inserire manualmente un rapporto (utile se hai dimenticato di avviare il timer o per giorni passati).
                                </List.Item>
                                <List.Item>
                                    <b>Contatto</b>: Ti permette di creare una nuova scheda persona nella Rubrica.
                                </List.Item>
                            </List>
                            <Alert variant="light" color="blue" title="Funzione Intelligente" mt="xs">
                                <Text size="xs">
                                    Se crei un <b>Nuovo Contatto</b> mentre il cronometro sta girando, quel contatto verrà automaticamente aggiunto alla tua sessione di servizio corrente!
                                </Text>
                            </Alert>
                        </Stack>
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="timer">
                    <Accordion.Control icon={<IconClock size={20} color="teal" />}>
                        Il Cronometro e la Dashboard
                    </Accordion.Control>
                    <Accordion.Panel>
                        <Stack gap="xs">
                            <Text size="sm" fw={700}>Come registrare il tempo?</Text>
                            <List size="sm" spacing="xs">
                                <List.Item>Dalla <b>Home</b>, premi il tasto <b>Play (Verde)</b> per iniziare.</List.Item>
                                <List.Item>Usa <b>Pausa (Giallo)</b> se ti interrompi.</List.Item>
                                <List.Item>Premi <b>Stop (Rosso)</b> quando hai finito la giornata.</List.Item>
                            </List>
                            <Text size="sm">
                                Al termine, vedrai un riepilogo. Potrai scrivere delle note generali e aggiungere le persone che hai contattato.
                            </Text>
                            <Text size="xs" c="dimmed">
                                Il timer è salvato online: puoi iniziarlo sul telefono e controllarlo dal tablet (se usi lo stesso account).
                            </Text>
                        </Stack>
                    </Accordion.Panel>
                </Accordion.Item>

                 <Accordion.Item value="contacts">
                    <Accordion.Control icon={<IconUsers size={20} color="grape" />}>
                        Rubrica Globale
                    </Accordion.Control>
                    <Accordion.Panel>
                        <Stack gap="xs">
                            <Text size="sm">
                                L'app include una <b>Rubrica Unica</b> centralizzata.
                                Ogni persona ha la sua scheda definitiva con:
                            </Text>
                            <List size="sm" spacing={4} withPadding>
                                <List.Item>Dati anagrafici (Nome, Indirizzo, Telefono).</List.Item>
                                <List.Item><b>Timeline Note</b>: Una storia cronologica di tutte le note che hai scritto su di lei.</List.Item>
                            </List>
                            <Text size="sm">
                                Puoi accedere alla rubrica completa dal menu in basso o laterale ("Contatti").
                                Quando aggiungi una visita nel calendario, cerchi semplicemente la persona dalla tua rubrica esistente.
                            </Text>
                        </Stack>
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="calendar">
                    <Accordion.Control icon={<IconCalendar size={20} color="red" />}>
                        Il Calendario
                    </Accordion.Control>
                    <Accordion.Panel>
                        <Text size="sm">
                           Visualizza la tua attività mensile.
                           <List size="sm" mt={4} spacing={4}>
                               <List.Item><b>Lineetta Verde</b>: Uscita di Servizio (Timer o Manuale).</List.Item>
                               <List.Item><b>Lineetta Rossa</b>: Contatto registrato.</List.Item>
                           </List>
                           Cliccando su un giorno puoi vedere i dettagli, modificare gli orari o aggiungere contatti a quella specifica visita (tramite il pulsante "Aggiungi contatto" nella scheda della visita).
                        </Text>
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="settings">
                    <Accordion.Control icon={<IconSettings size={20} color="gray" />}>
                        Impostazioni e Ruoli
                    </Accordion.Control>
                    <Accordion.Panel>
                        <Text size="sm">
                            Nella sezione Impostazioni puoi personalizzare il tuo account in base alle tue esigenze mensili:
                        </Text>
                        <List size="sm" mt="xs" spacing="xs">
                            <List.Item><b>Obiettivo Mensile e Ruolo</b>: Scegli tu se essere Proclamatore o Pioniere (Ausiliario o Regolare) per ogni singolo mese. Il sistema adatterà il tuo obiettivo "Ore" di conseguenza.</List.Item>
                            <List.Item><b>Monte Ore Arretrato</b>: Solo per i Pionieri Regolari appare una funzione per sommare ore dei mesi passati e calcolare perfettamente l'obiettivo annuale di 600h.</List.Item>
                            <List.Item><b>Catalogo Pubblicazioni</b>: Crea una lista delle riviste o brochure che usi più spesso, così potrai selezionarle velocemente durante il servizio.</List.Item>
                        </List>
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="report">
                    <Accordion.Control icon={<IconFileDescription size={20} color="teal" />}>
                        Generazione Report PDF
                    </Accordion.Control>
                    <Accordion.Panel>
                        <Stack gap="xs">
                            <Text size="sm">
                                L'app è in grado di compilare automaticamente il calcolo finale della tua attività:
                            </Text>
                            <List size="sm" spacing={4} withPadding>
                                <List.Item>Entra in <b>Report PDF</b> dal menu laterale.</List.Item>
                                <List.Item>Scegli il periodo di Date che desideri rendicontare.</List.Item>
                                <List.Item>Il sistema mostrerà a video le uscite totali, le ore esatte calcolate e le copie esatte di pubblicazioni che hai consegnato (incrociandole con il tuo Catalogo).</List.Item>
                            </List>
                            <Text size="sm">
                                Cliccando "Scarica PDF" otterrai un documento elegante e professionale con la tabella dei tuoi risultati, pronto all'uso!
                            </Text>
                        </Stack>
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="offline">
                    <Accordion.Control icon={<IconWifiOff size={20} color="orange" />}>
                        Funziona senza internet?
                    </Accordion.Control>
                    <Accordion.Panel>
                        <Stack gap="xs">
                            <Text size="sm">
                               <b>Sì, puoi usare l'app ovunque.</b>
                            </Text>
                            <Text size="sm">
                                Se non c'è campo, l'app salva tutto (timer, contatti, rapporti) nella memoria del telefono. Non perderai nulla.
                            </Text>
                            <Text size="sm">
                                Appena torna internet, i dati vengono inviati automaticamente.
                                Controlla l'icona della <b>Nuvoletta</b> in alto:
                            </Text>
                            <List size="sm" spacing={4} withPadding>
                                <List.Item><b>Arancione</b>: Sei offline (dati salvati sul telefono).</List.Item>
                                <List.Item><b>Verde</b>: Tutto sincronizzato online.</List.Item>
                            </List>
                        </Stack>
                    </Accordion.Panel>
                </Accordion.Item>

             </Accordion>
        </Stack>
    );
}
