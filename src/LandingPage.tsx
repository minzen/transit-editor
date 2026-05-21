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

            {/* Features Section */}
            <Container maxWidth="lg" sx={{ py: 12 }}>
                <Typography variant="h3" component="h2" sx={{ mb: 8, textAlign: 'center', fontWeight: 600 }}>
                    Powerful Features
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    <Box sx={{ flex: '1 1 300px', maxWidth: 'calc(25% - 16px)' }}>
                        <Card sx={{ height: '100%', '&:hover': { transform: 'translateY(-4px)', transition: 'transform 0.2s' } }}>
                            <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                <Box sx={{ mb: 2, color: 'primary.main' }}>
                                    <Map sx={{ fontSize: 48 }} />
                                </Box>
                                <Typography variant="h6" component="h3" sx={{ mb: 2, fontWeight: 600 }}>
                                    Intuitive Canvas
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Pan, zoom, and edit with mouse and keyboard.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>
                    <Box sx={{ flex: '1 1 300px', maxWidth: 'calc(25% - 16px)' }}>
                        <Card sx={{ height: '100%', '&:hover': { transform: 'translateY(-4px)', transition: 'transform 0.2s' } }}>
                            <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                <Box sx={{ mb: 2, color: 'primary.main' }}>
                                    <Train sx={{ fontSize: 48 }} />
                                </Box>
                                <Typography variant="h6" component="h3" sx={{ mb: 2, fontWeight: 600 }}>
                                    Octolinear Design
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Snaps segments to 45° and 90° angles.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>
                    <Box sx={{ flex: '1 1 300px', maxWidth: 'calc(25% - 16px)' }}>
                        <Card sx={{ height: '100%', '&:hover': { transform: 'translateY(-4px)', transition: 'transform 0.2s' } }}>
                            <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                <Box sx={{ mb: 2, color: 'primary.main' }}>
                                    <Palette sx={{ fontSize: 48 }} />
                                </Box>
                                <Typography variant="h6" component="h3" sx={{ mb: 2, fontWeight: 600 }}>
                                    Multiple Lines
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Multiple lines with custom colors, names, and optional short codes.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>
                    <Box sx={{ flex: '1 1 300px', maxWidth: 'calc(25% - 16px)' }}>
                        <Card sx={{ height: '100%', '&:hover': { transform: 'translateY(-4px)', transition: 'transform 0.2s' } }}>
                            <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                <Box sx={{ mb: 2, color: 'primary.main' }}>
                                    <Undo sx={{ fontSize: 48 }} />
                                </Box>
                                <Typography variant="h6" component="h3" sx={{ mb: 2, fontWeight: 600 }}>
                                    Undo/Redo
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Step backwards and forwards through your edits.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>
            </Container>

            {/* Demo Section */}
            <Box sx={{ bgcolor: 'grey.50', py: 12 }}>
                <Container maxWidth="lg">
                    <Typography variant="h3" component="h2" sx={{ mb: 8, textAlign: 'center', fontWeight: 600 }}>
                        See It In Action
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, mb: 6 }}>
                        <Box sx={{ flex: '1 1 400px', maxWidth: 'calc(50% - 16px)' }}>
                            <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                <CardMedia
                                    component="img"
                                    image={editorInterface}
                                    alt="Editor Interface"
                                    sx={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                                />
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="h6" gutterBottom>Editor Interface</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        The editing canvas with toolbar controls
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>
                        <Box sx={{ flex: '1 1 400px', maxWidth: 'calc(50% - 16px)' }}>
                            <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                <CardMedia
                                    component="img"
                                    image={editorExample}
                                    alt="Exported Map Example"
                                    sx={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                                />
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="h6" gutterBottom>Exported Map</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Export the result as SVG or PNG
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleNavigateToEditor}
                            endIcon={<ArrowForward />}
                        >
                            Try It Now
                        </Button>
                    </Box>
                </Container>
            </Box>

            {/* CTA Section */}
            <Box sx={{ py: 12, textAlign: 'center' }}>
                <Container maxWidth="md">
                    <Typography variant="h4" component="h2" sx={{ mb: 4, fontWeight: 600 }}>
                        Ready to Create Your Transit Map?
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 6, color: 'text.secondary' }}>
                        Runs entirely in your browser. No account or installation required.
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        onClick={handleNavigateToEditor}
                        endIcon={<ArrowForward />}
                        sx={{ py: 2, px: 6 }}
                    >
                        Launch Editor
                    </Button>
                </Container>
            </Box>

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
                            href="https://issues.transit-map-editor.online/"
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
