import { Alert, AlertTitle, Box, Chip, Container, Typography, Button, Card, CardContent, CardMedia } from '@mui/material'
import { ArrowForward, Map, Train, Palette, Undo, Construction } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import editorInterface from './assets/transit-editor-interface.png'
import editorExample from './assets/transit-editor-example.png'

export function LandingPage() {
    const navigate = useNavigate()

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
                            Transit Map Editor
                        </Typography>
                        <Chip
                            icon={<Construction />}
                            label="Early dev version"
                            color="warning"
                            sx={{ fontWeight: 600 }}
                        />
                    </Box>
                    <Typography variant="h4" component="h2" sx={{ mb: 4, opacity: 0.95 }}>
                        Create beautiful, schematic transit maps directly in your browser
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 6, maxWidth: 600, opacity: 0.9 }}>
                        A browser-based editor for sketching schematic transit maps. Work in progress.
                    </Typography>
                    <Button
                        variant="contained"
                        color="secondary"
                        size="large"
                        onClick={handleNavigateToEditor}
                        endIcon={<ArrowForward />}
                        sx={{ py: 2, px: 4, fontSize: '1.1rem' }}
                    >
                        Start Creating
                    </Button>
                </Container>
            </Box>

            {/* Early dev notice */}
            <Container maxWidth="lg" sx={{ pt: 6 }}>
                <Alert severity="warning" icon={<Construction />} sx={{ alignItems: 'center' }}>
                    <AlertTitle sx={{ fontWeight: 700 }}>Early development version</AlertTitle>
                    This is an early, in-development build. Expect rough edges, missing features, and breaking changes.
                    Bug reports and feedback are very welcome on the issue tracker.
                </Alert>
            </Container>

            {/* Footer */}
            <Box sx={{ bgcolor: 'grey.900', color: 'grey.300', py: 6, px: 3 }}>
                <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
                    <Typography variant="body2">
                        Built with React, TypeScript, and Material Design
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        © 2026 Transit Map Editor. Open source and free to use.
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
                            GitHub Repository
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
                            Report Issues
                        </Typography>
                    </Box>
                </Container>
            </Box>
        </Box>
    )
}
