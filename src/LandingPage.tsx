import { Alert, AlertTitle, Box, Chip, Container, Typography, Button } from '@mui/material'
import { ArrowForward, Construction } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function LandingPage() {
    const navigate = useNavigate()
    const { t } = useTranslation()

    const handleNavigateToEditor = () => {
        void navigate('/editor')
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* Hero Section */}
            <Box
                sx={{
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    py: 12,
                    px: 3,
                }}
            >
                <Container maxWidth="lg">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                        <Typography variant="h1" component="h1" sx={{ fontWeight: 700 }}>
                            {t('landingPage.title')}
                        </Typography>
                        <Chip
                            icon={<Construction />}
                            label={t('landingPage.earlyDevVersion')}
                            color="warning"
                            sx={{ fontWeight: 600 }}
                        />
                    </Box>
                    <Typography variant="h4" component="h2" sx={{ mb: 4, opacity: 0.95 }}>
                        {t('landingPage.subtitle')}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 6, maxWidth: 600, opacity: 0.9 }}>
                        {t('landingPage.description')}
                    </Typography>
                    <Button
                        variant="contained"
                        color="secondary"
                        size="large"
                        onClick={handleNavigateToEditor}
                        endIcon={<ArrowForward />}
                        sx={{ py: 2, px: 4, fontSize: '1.1rem' }}
                    >
                        {t('landingPage.startCreating')}
                    </Button>
                </Container>
            </Box>

            {/* Early dev notice */}
            <Container maxWidth="lg" sx={{ pt: 6 }}>
                <Alert severity="warning" icon={<Construction />} sx={{ alignItems: 'center' }}>
                    <AlertTitle sx={{ fontWeight: 700 }}>{t('landingPage.earlyDevAlertTitle')}</AlertTitle>
                    {t('landingPage.earlyDevAlertBody')}
                </Alert>
            </Container>

            {/* Footer */}
            <Box sx={{ bgcolor: 'grey.900', color: 'grey.300', py: 6, px: 3 }}>
                <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
                    <Typography variant="body2">
                        {t('landingPage.builtWith')}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        {t('landingPage.copyright')}
                    </Typography>
                    <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Typography
                            variant="body2"
                            component="a"
                            href="https://github.com/minzen/transit-editor"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ color: 'primary.light', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                        >
                            {t('landingPage.githubRepository')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'grey.500' }}>
                            •
                        </Typography>
                        <Typography
                            variant="body2"
                            component="a"
                            href="https://issues.transit-map-editor.online/projects/transit-map-editor/issues"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ color: 'primary.light', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                        >
                            {t('landingPage.reportIssues')}
                        </Typography>
                    </Box>
                </Container>
            </Box>
        </Box>
    )
}
