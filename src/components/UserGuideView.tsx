import { Accordion, Text, Title, List, Stack } from '@mantine/core';
import { IconInfoCircle, IconClock, IconCalendar, IconUsers, IconWifiOff, IconTargetArrow } from '@tabler/icons-react';

export default function UserGuideView() {
    return (
        <Stack gap="lg">
             <Title order={3}>Manuale Utente</Title>
             <Text c="dimmed">Benvenuto nella guida semplice per usare al meglio la tua Agenda Servizio.</Text>

             <Accordion variant="separated" radius="md" chevronPosition="left">
                
                <Accordion.Item value="intro">
                    <Accordion.Control icon={<IconInfoCircle size={20} color="blue" />}>
                        Introduzione
                    </Accordion.Control>
                    <Accordion.Panel>
                        <Text size="sm">
                            Questa app ti aiuta a tenere traccia del tuo servizio, salvare gli orari, i contatti e le visite fatte. 
                            È pensata per essere semplice: tutto quello che fai viene salvato automaticamente nel tuo telefono e, quando c'è internet, anche online.
                        </Text>
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
                                <List.Item>Nella Home (Panoramica), vedrai un riquadro con un tasto Play verde.</List.Item>
                                <List.Item>Premi <b>Avvia</b> quando inizi il servizio.</List.Item>
                                <List.Item>Se ti fermi per una pausa, premi il tasto <b>Pausa (Giallo)</b>. Il tempo si ferma.</List.Item>
                                <List.Item>Quando hai finito, premi <b>Stop (Rosso)</b>.</List.Item>
                                <List.Item>Si aprirà una finestra dove puoi scrivere due righe di note o aggiungere chi hai contattato.</List.Item>
                                <List.Item>Premi "Salva" e le ore verranno aggiunte al tuo totale mensile!</List.Item>
                            </List>
                             <Text size="sm" mt="xs" c="dimmed">Nota: Se chiudi l'app o spegni il telefono mentre il cronometro gira, non preoccuparti! Al riavvio troverai il tempo corretto.</Text>
                        </Stack>
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="goals">
                    <Accordion.Control icon={<IconTargetArrow size={20} color="indigo" />}>
                        I Tuoi Obiettivi
                    </Accordion.Control>
                    <Accordion.Panel>
                        <Text size="sm">
                            Sotto al cronometro vedrai un cerchio che si riempie. 
                            Quello indica quanto manca al tuo obiettivo mensile (che puoi impostare nelle Impostazioni).
                            Ti dice chiaramente quante ore hai fatto, quante te ne mancano e quanti giorni restano alla fine del mese.
                        </Text>
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="calendar">
                    <Accordion.Control icon={<IconCalendar size={20} color="red" />}>
                        Il Calendario
                    </Accordion.Control>
                    <Accordion.Panel>
                        <Text size="sm">
                           Qui vedi i giorni del mese. 
                           <List size="sm" mt={4} spacing={4}>
                               <List.Item><b>Lineetta Verde</b>: Hai registrato del <b>Tempo</b> di servizio.</List.Item>
                               <List.Item><b>Lineetta Rossa</b>: Hai registrato un <b>Contatto</b> o visita.</List.Item>
                           </List>
                           Clicca su un giorno per vedere i dettagli: cosa hai fatto, le note e le visite.
                           Puoi anche aggiungere manualmente un rapporto se ti sei dimenticato di usare il cronometro.
                        </Text>
                    </Accordion.Panel>
                </Accordion.Item>

                 <Accordion.Item value="contacts">
                    <Accordion.Control icon={<IconUsers size={20} color="grape" />}>
                        Rubrica Contatti
                    </Accordion.Control>
                    <Accordion.Panel>
                        <Text size="sm">
                           Tieni traccia delle persone interessate. 
                           Puoi salvare il nome, l'indirizzo e note importanti. 
                           Dalla sezione <b>Contatti</b> (icona con due omini) puoi cercarli velocemente.
                        </Text>
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="offline">
                    <Accordion.Control icon={<IconWifiOff size={20} color="orange" />}>
                        Funziona senza internet?
                    </Accordion.Control>
                    <Accordion.Panel>
                        <Text size="sm">
                           <b>Assolutamente sì.</b>
                           Puoi usare l'app anche in modalità aereo o dove non c'è campo.
                           Tutto viene salvato sul tuo telefono. Appena il telefono ritrova la connessione, l'app invierà tutto al sicuro nel cloud.
                           Guarda l'icona della nuvoletta in alto a destra: se è Arancione sei offline (ma al sicuro), se è Verde è tutto sincronizzato.
                        </Text>
                    </Accordion.Panel>
                </Accordion.Item>

             </Accordion>
        </Stack>
    );
}
